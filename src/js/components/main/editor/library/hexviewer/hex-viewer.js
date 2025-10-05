import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Hex } from './hex';
import { Buffer } from 'buffer';

const HexViewer = ({
    rowLength = 16,
    setLength = 4,
    children,
    base64,
    hex,
    noData,
    onLoadingStateChange,
    onProgressChange,
    darkMode
}) => {
    const [rows, setRows] = useState([]);
    const [isErrorData, setIsErrorData] = useState(false);
    const [loadingState, setLoadingState] = useState('idle');
    const [percent, setPercent] = useState(0);
    const [renderReady, setRenderReady] = useState(false);
    const workerRef = useRef(null);
    const lastPercentRef = useRef(0);
    const isMountedRef = useRef(true);
    const idleTimeoutRef = useRef(null);
    // Lazy load worker and hexviewer.js
    useEffect(() => {
        let isError = false;
        let isMounted = true; // Track if component is mounted

        // Clean up previous worker if it exists
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }

        setLoadingState('processing');
        setPercent(0);
        setRows([]); // Clear old rows immediately
        setRenderReady(false); // Reset render gate
        lastPercentRef.current = 0;
        onLoadingStateChange?.('processing');
        onProgressChange?.(0);
        let bufferData = [];

        // Load worker lazily
        var loadWorker = function () {
            return new Promise(function (resolve) {
                if (!workerRef.current) {
                    workerRef.current = new Worker(new URL('./hexWorker.js', import.meta.url));
                }
                resolve(workerRef.current);
            });
        };

        var processData = function (worker, data) {
            return new Promise(function (resolve, reject) {
                worker.onmessage = function (e) {
                    if (!isMounted) return; // Don't update state if unmounted

                    if (e.data.type === 'progress') {
                        const newPercent = Math.max(lastPercentRef.current, e.data.percent);
                        lastPercentRef.current = newPercent;
                        setPercent(newPercent);
                        onProgressChange?.(newPercent);
                    }
                    else if (e.data.type === 'done') {
                        resolve(e.data.rows);
                    }
                    else if (e.data.type === 'error') {
                        console.error('[HexViewer] Worker error:', e.data.error);
                        isError = true;
                        reject(new Error(e.data.error));
                    }
                };
                worker.onerror = function (error) {
                    if (!isMounted) return;
                    console.error('[HexViewer] Worker error:', error);
                    isError = true;
                    reject(error);
                };

                var arrBuffer = (data instanceof ArrayBuffer) ? data : new Uint8Array(data).buffer;
                worker.postMessage({ buffer: arrBuffer, rowLength: rowLength, setLength: setLength }, [arrBuffer]);
            });
        };

        const initializeProcessing = async () => {
            try {
                let rawData;
                if (hex) {
                    rawData = Buffer.from(children, "hex");
                } else if (base64) {
                    rawData = Buffer.from(children, "base64");
                } else {
                    rawData = children;
                }
                rawData = rawData || [];
                const bytes = rawData.length;

                if (Buffer.isBuffer(rawData)) {
                    for (let i = 0; i < bytes; i += 1) {
                        bufferData.push(rawData[i]);
                    }
                    if (typeof bufferData === "string") {
                        bufferData = [];
                        isError = true;
                    }
                } else {
                    bufferData = rawData;
                }

                const worker = await loadWorker();
                const processedRows = await processData(worker, bufferData);

                // Transition to preparing state
                setLoadingState('preparing');
                onLoadingStateChange?.('preparing');

                if (!isMounted) return;

                // Set rows first
                setRows(processedRows);

                // Wait before allowing Hex to render
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!isMounted) return;

                setRenderReady(true);

                // Clear any pending idle timeout
                if (idleTimeoutRef.current) {
                    clearTimeout(idleTimeoutRef.current);
                }

                // Set idle state immediately
                setLoadingState('idle');
                onLoadingStateChange?.('idle');
            } catch (error) {
                console.error('[HexViewer] Error processing hex data:', error);
                isError = true;
                setRows([]);
                setLoadingState('idle');
                onLoadingStateChange?.('error');
            }
            setIsErrorData(isError);
        };

        initializeProcessing();

        return function cleanup() {
            isMounted = false;
            isMountedRef.current = false;

            // Clear any pending timeouts
            if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
                idleTimeoutRef.current = null;
            }

            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [children, base64, hex, rowLength, setLength]);

    return (
        <div className="hexviewer-container" style={{ height: '100%', width: '100%' }}>
            {loadingState === 'processing' && (
                <div className={`hexviewer-loading ${darkMode ? 'dark' : ''}`}>Processing data...</div>
            )}
            {loadingState === 'preparing' && (
                <div className={`hexviewer-loading ${darkMode ? 'dark' : ''}`}>Preparing display...</div>
            )}
            {isErrorData && (errorData || <div>Error Data</div>)}
            {!rows.length && !isErrorData && loadingState === 'idle' && (noData || <div>No Data</div>)}
            {!!rows.length && !isErrorData && renderReady && (
                <React.Suspense fallback={<div className={`hexviewer-loading ${darkMode ? 'dark' : ''}`}>Loading...</div>}>
                    <Hex rows={rows} bytesper={rowLength} />
                </React.Suspense>
            )}
        </div>
    );
};
export { HexViewer };
