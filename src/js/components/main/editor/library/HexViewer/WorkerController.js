// WorkerController.js - Manages communication between React component and HexParserWorker
"use strict";

class WorkerController {
    constructor() {
        this.worker = null;
        this.currentOperationId = 0;
        this.pendingOperations = new Map();
        this.isDestroyed = false;
    }

    initialize() {
        if (this.worker || this.isDestroyed) return;

        try {
            // Create worker from blob to avoid file serving issues
            const workerCode = `
                // HexParserWorker.js - Web Worker for non-blocking hex data parsing
                "use strict";

                // Buffer polyfill for web workers
                if (typeof Buffer === 'undefined') {
                    // Simple Buffer polyfill for basic usage
                    self.Buffer = class Buffer {
                        constructor(data, encoding) {
                            if (typeof data === 'string') {
                                if (encoding === 'hex') {
                                    this.data = this.fromHex(data);
                                } else if (encoding === 'base64') {
                                    this.data = this.fromBase64(data);
                                } else {
                                    this.data = new TextEncoder().encode(data);
                                }
                            } else if (Array.isArray(data)) {
                                this.data = new Uint8Array(data);
                            } else if (data instanceof Uint8Array) {
                                this.data = data;
                            } else {
                                this.data = new Uint8Array(0);
                            }
                            this.length = this.data.length;
                        }

                        static from(data, encoding) {
                            return new Buffer(data, encoding);
                        }

                        static isBuffer(obj) {
                            return obj instanceof Buffer;
                        }

                        static alloc(size) {
                            return new Buffer(new Uint8Array(size));
                        }

                        fromHex(hexString) {
                            const bytes = [];
                            for (let i = 0; i < hexString.length; i += 2) {
                                bytes.push(parseInt(hexString.substr(i, 2), 16));
                            }
                            return new Uint8Array(bytes);
                        }

                        fromBase64(base64String) {
                            const binaryString = atob(base64String);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            return bytes;
                        }

                        toString(encoding) {
                            if (encoding === 'hex') {
                                return Array.from(this.data).map(b => b.toString(16).padStart(2, '0')).join('');
                            } else if (encoding === 'base64') {
                                const binaryString = String.fromCharCode(...this.data);
                                return btoa(binaryString);
                            }
                            return new TextDecoder().decode(this.data);
                        }
                    };
                }

                // Message types
                const MESSAGE_TYPES = {
                    PARSE_DATA: 'PARSE_DATA',
                    CHUNK_PARSED: 'CHUNK_PARSED',
                    ERROR: 'ERROR',
                    COMPLETE: 'COMPLETE',
                    ABORT: 'ABORT'
                };

                // Configuration - adaptive chunk sizing
                let DEFAULT_CHUNK_SIZE = 65536; // 64KB starting point
                const BATCH_DELAY = 0; // ms delay between batches for UI responsiveness
                const PERFORMANCE_SAMPLES = 5; // Number of samples for performance measurement
                let performanceHistory = [];

                // Global abort controller for current operation - must be in global scope for onmessage access
                let currentAbortController = null;
                function adjustChunkSize(processingTimeMs, dataSize) {
                    performanceHistory.push({ time: processingTimeMs, size: dataSize });

                    // Keep only recent samples and clean up old data
                    if (performanceHistory.length > PERFORMANCE_SAMPLES) {
                        performanceHistory.shift();
                    }

                    // Clean up very old performance data to prevent memory leaks
                    if (performanceHistory.length > PERFORMANCE_SAMPLES * 2) {
                        performanceHistory = performanceHistory.slice(-PERFORMANCE_SAMPLES);
                    }

                    if (performanceHistory.length >= 3) {
                        const avgTime = performanceHistory.reduce((sum, p) => sum + p.time, 0) / performanceHistory.length;
                        const avgSize = performanceHistory.reduce((sum, p) => sum + p.size, 0) / performanceHistory.length;

                        // Target ~50ms per chunk for smooth UI
                        const targetTime = 50;
                        const currentTimePerByte = avgTime / avgSize;

                        if (avgTime > targetTime * 1.5) {
                            // Too slow, reduce chunk size
                            DEFAULT_CHUNK_SIZE = Math.max(8192, DEFAULT_CHUNK_SIZE * 0.8);
                        } else if (avgTime < targetTime * 0.7) {
                            // Fast enough, can increase chunk size
                            DEFAULT_CHUNK_SIZE = Math.min(262144, DEFAULT_CHUNK_SIZE * 1.2);
                        }

                        console.log('Worker adjusted chunk size:', DEFAULT_CHUNK_SIZE, 'bytes (avg time:', avgTime.toFixed(2), 'ms)');
                    }
                }

                function parseDataInChunks(data, encoding, rowLength, setLength, operationId) {
                    return new Promise((resolve, reject) => {
                        console.log('Worker parseDataInChunks called with:', { dataLength: data?.length, encoding, rowLength, setLength, operationId });
                        currentAbortController = { abort: false };

                        try {
                            let bufferData = [];
                            let rawData;

                            // Parse input data based on encoding
                            if (encoding === 'hex') {
                                console.log('Worker parsing hex data');
                                rawData = Buffer.from(data, "hex");
                            } else if (encoding === 'base64') {
                                console.log('Worker parsing base64 data');
                                rawData = Buffer.from(data, "base64");
                            } else {
                                console.log('Worker using raw data');
                                rawData = data;
                            }

                            rawData = rawData || [];
                            const bytes = rawData.length;
                            console.log('Worker data length:', bytes);

                            // Convert buffer to array if needed
                            if (Buffer.isBuffer(rawData)) {
                                console.log('Worker converting buffer to array');
                                for (let i = 0; i < bytes; i++) {
                                    bufferData.push(rawData.data[i]);
                                }
                            } else {
                                console.log('Worker using raw data directly');
                                bufferData = rawData;
                            }

                            // Process data in chunks
                            const totalChunks = Math.ceil(bytes / DEFAULT_CHUNK_SIZE);
                            let processedChunks = 0;
                            let allRows = [];

                            function processNextChunk() {
                                console.log('Worker processing chunk:', processedChunks + 1, 'of', totalChunks);
                                if (currentAbortController && currentAbortController.abort) {
                                    postMessage({
                                        type: MESSAGE_TYPES.ABORT,
                                        payload: { 
                                            operationId: operationId,
                                            message: 'Operation aborted' 
                                        }
                                    });
                                    return;
                                }

                                const start = processedChunks * DEFAULT_CHUNK_SIZE;
                                const end = Math.min(start + DEFAULT_CHUNK_SIZE, bytes);
                                const chunk = bufferData.slice(start, end);
                                console.log('Worker chunk size:', chunk.length, 'start:', start, 'end:', end);

                                // Measure performance for adaptive chunk sizing
                                const chunkStartTime = performance.now();

                                // Parse this chunk into rows
                                const chunkRows = parseChunkToRows(chunk, rowLength, setLength, start);

                                // Add to accumulated results
                                allRows.push(...chunkRows);

                                processedChunks++;
                                console.log('Worker processed chunk, total processed:', processedChunks);

                                const chunkEndTime = performance.now();
                                const chunkProcessingTime = chunkEndTime - chunkStartTime;

                                // Adjust chunk size based on performance
                                adjustChunkSize(chunkProcessingTime, chunk.length);

                                // Send progress update
                                postMessage({
                                    type: MESSAGE_TYPES.CHUNK_PARSED,
                                    payload: {
                                        operationId: operationId,
                                        rows: chunkRows,
                                        chunkIndex: processedChunks,
                                        totalChunks: totalChunks,
                                        isComplete: processedChunks === totalChunks
                                    }
                                });

                                if (processedChunks < totalChunks) {
                                    // Continue with next chunk after small delay
                                    if (BATCH_DELAY > 0) {
                                        setTimeout(processNextChunk, BATCH_DELAY);
                                    } else {
                                        // Use requestIdleCallback for better performance
                                        if (typeof requestIdleCallback !== 'undefined') {
                                            requestIdleCallback(processNextChunk);
                                        } else {
                                            setTimeout(processNextChunk, 0);
                                        }
                                    }
                                } else {
                                    // All chunks processed
                                    console.log('Worker completed all chunks');
                                    postMessage({
                                        type: MESSAGE_TYPES.COMPLETE,
                                        payload: {
                                            operationId: operationId,
                                            totalRows: allRows.length,
                                            totalBytes: bytes
                                        }
                                    });

                                    // Clean up performance history periodically to prevent memory leaks
                                    if (performanceHistory.length > PERFORMANCE_SAMPLES * 3) {
                                        performanceHistory = performanceHistory.slice(-PERFORMANCE_SAMPLES);
                                    }

                                    resolve(allRows);
                                }
                            }

                            // Start processing
                            if (bytes > 0) {
                                processNextChunk();
                            } else {
                                // Empty data
                                postMessage({
                                    type: MESSAGE_TYPES.CHUNK_PARSED,
                                    payload: {
                                        operationId: operationId,
                                        rows: [],
                                        chunkIndex: 1,
                                        totalChunks: 1,
                                        isComplete: true
                                    }
                                });
                                postMessage({
                                    type: MESSAGE_TYPES.COMPLETE,
                                    payload: {
                                        operationId: operationId,
                                        totalRows: 0,
                                        totalBytes: 0
                                    }
                                });
                                resolve([]);
                            }

                        } catch (error) {
                            postMessage({
                                type: MESSAGE_TYPES.ERROR,
                                payload: {
                                    operationId: operationId,
                                    message: error.message,
                                    stack: error.stack
                                }
                            });
                            reject(error);
                        }
                    });
                }

                function parseChunkToRows(bufferData, rowLength, setLength, startOffset) {
                    const rows = [];

                    for (let i = 0; i < bufferData.length; i += rowLength) {
                        const temparray = bufferData.slice(i, i + rowLength);

                        // Pad to row length
                        for (let z = temparray.length; z < rowLength; z++) {
                            temparray.push(-1);
                        }

                        const row = [];

                        // Group into sets
                        for (let x = 0, k = temparray.length; x < k; x += setLength) {
                            let set = temparray.slice(x, x + setLength);

                            // Pad set to setLength
                            for (let z = set.length; z < setLength; z++) {
                                set.push(-1);
                            }

                            row.push(set);
                        }

                        rows.push(row);
                    }

                    return rows;
                }

                // Handle messages from main thread
                self.onmessage = function(e) {
                    console.log('Worker received message:', e.data);
                    const { type, payload } = e.data;

                    switch (type) {
                        case MESSAGE_TYPES.PARSE_DATA:
                            console.log('Worker starting parse operation:', payload);
                            currentAbortController = { abort: false };
                            parseDataInChunks(
                                payload.data,
                                payload.encoding,
                                payload.rowLength,
                                payload.setLength,
                                payload.operationId
                            ).catch(error => {
                                console.error('Worker parse error:', error);
                                // Error already handled in parseDataInChunks
                            });
                            break;

                        case MESSAGE_TYPES.ABORT:
                            console.log('Worker received abort');
                            if (currentAbortController) {
                                currentAbortController.abort = true;
                            }
                            break;

                        default:
                            console.error('Worker unknown message type:', type);
                            postMessage({
                                type: MESSAGE_TYPES.ERROR,
                                payload: {
                                    message: 'Unknown message type: ' + type
                                }
                            });
                    }
                };
            `;

            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            this.worker = new Worker(blobUrl);

            // Store blob URL for cleanup
            this.worker._blobUrl = blobUrl;

            this.worker.onmessage = (e) => this.handleWorkerMessage(e);
            this.worker.onerror = (e) => this.handleWorkerError(e);

        } catch (error) {
            console.error('Failed to initialize HexParserWorker:', error);
            throw error;
        }
    }

    handleWorkerMessage(e) {
        console.log('Main thread received worker message:', e.data);
        const { type, payload } = e.data;
        const operationId = payload.operationId;

        switch (type) {
            case 'CHUNK_PARSED':
                console.log('Main thread received chunk parsed:', payload);
                this.handleChunkParsed(operationId, payload);
                break;
            case 'COMPLETE':
                console.log('Main thread received complete:', payload);
                this.handleComplete(operationId, payload);
                break;
            case 'ERROR':
                console.log('Main thread received error:', payload);
                this.handleError(operationId, payload);
                break;
            case 'ABORT':
                console.log('Main thread received abort:', payload);
                this.handleAbort(operationId, payload);
                break;
            default:
                console.warn('Main thread unknown worker message type:', type);
        }
    }

    handleWorkerError(e) {
        console.error('Worker error:', e);
        // Notify all pending operations of the error
        for (const [operationId, operation] of this.pendingOperations) {
            operation.reject(new Error('Worker error: ' + e.message));
        }
        this.pendingOperations.clear();
    }

    handleChunkParsed(operationId, payload) {
        const operation = this.pendingOperations.get(operationId);
        if (operation) {
            operation.onChunk?.(payload);

            // Schedule state update to avoid blocking
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => operation.onChunk?.(payload));
            } else {
                setTimeout(() => operation.onChunk?.(payload), 0);
            }
        }
    }

    handleComplete(operationId, payload) {
        const operation = this.pendingOperations.get(operationId);
        if (operation) {
            this.pendingOperations.delete(operationId);
            operation.resolve(payload);
        }
    }

    handleError(operationId, payload) {
        const operation = this.pendingOperations.get(operationId);
        if (operation) {
            this.pendingOperations.delete(operationId);
            operation.reject(new Error(payload.message));
        }
    }

    handleAbort(operationId, payload) {
        const operation = this.pendingOperations.get(operationId);
        if (operation) {
            this.pendingOperations.delete(operationId);
            operation.reject(new Error(payload.message || 'Operation aborted'));
        }
    }

    parseData(data, encoding, rowLength, setLength) {
        return new Promise((resolve, reject) => {
            if (this.isDestroyed) {
                reject(new Error('WorkerController has been destroyed'));
                return;
            }

            if (!this.worker) {
                this.initialize();
            }

            const operationId = ++this.currentOperationId;

            this.pendingOperations.set(operationId, {
                resolve,
                reject,
                onChunk: null
            });

            // Send parse request to worker
            console.log('Main thread sending parse request to worker:', {
                operationId,
                dataLength: data?.length,
                encoding,
                rowLength,
                setLength
            });
            this.worker.postMessage({
                type: 'PARSE_DATA',
                payload: {
                    operationId,
                    data,
                    encoding,
                    rowLength,
                    setLength
                }
            });

            // Set up timeout for the operation
            const timeout = setTimeout(() => {
                this.abortOperation(operationId);
                reject(new Error('Parse operation timed out'));
            }, 10000); // 10 second timeout (reduced from 60s)

            // Store timeout for cleanup
            this.pendingOperations.get(operationId).timeout = timeout;
        });
    }

    parseDataWithCallback(data, encoding, rowLength, setLength, onChunk) {
        return new Promise((resolve, reject) => {
            if (this.isDestroyed) {
                reject(new Error('WorkerController has been destroyed'));
                return;
            }

            if (!this.worker) {
                this.initialize();
            }

            const operationId = ++this.currentOperationId;

            this.pendingOperations.set(operationId, {
                resolve,
                reject,
                onChunk
            });

            // Send parse request to worker
            console.log('Main thread sending parse request to worker:', {
                operationId,
                dataLength: data?.length,
                encoding,
                rowLength,
                setLength
            });
            this.worker.postMessage({
                type: 'PARSE_DATA',
                payload: {
                    operationId,
                    data,
                    encoding,
                    rowLength,
                    setLength
                }
            });

            // Set up timeout for the operation
            const timeout = setTimeout(() => {
                this.abortOperation(operationId);
                reject(new Error('Parse operation timed out'));
            }, 10000); // 10 second timeout (reduced from 60s)

            // Store timeout for cleanup
            this.pendingOperations.get(operationId).timeout = timeout;
        });
    }

    abortOperation(operationId) {
        if (this.worker && !this.isDestroyed) {
            this.worker.postMessage({
                type: 'ABORT',
                payload: { operationId }
            });
        }

        const operation = this.pendingOperations.get(operationId);
        if (operation && operation.timeout) {
            clearTimeout(operation.timeout);
        }

        this.pendingOperations.delete(operationId);
    }

    abortAll() {
        if (this.worker && !this.isDestroyed) {
            this.worker.postMessage({
                type: 'ABORT',
                payload: {}
            });
        }

        // Clear all timeouts
        for (const operation of this.pendingOperations.values()) {
            if (operation.timeout) {
                clearTimeout(operation.timeout);
            }
        }

        this.pendingOperations.clear();
    }

    destroy() {
        this.isDestroyed = true;
        this.abortAll();

        if (this.worker) {
            // Revoke the blob URL if it exists
            if (this.worker._blobUrl) {
                URL.revokeObjectURL(this.worker._blobUrl);
            }
            this.worker.terminate();
            this.worker = null;
        }

        // Clean up performance history to prevent memory leaks
        if (typeof performanceHistory !== 'undefined') {
            performanceHistory.length = 0;
        }
    }
}

// Singleton instance for the application
let workerControllerInstance = null;

export function getWorkerController() {
    if (!workerControllerInstance || workerControllerInstance.isDestroyed) {
        workerControllerInstance = new WorkerController();
    }
    return workerControllerInstance;
}

export { WorkerController };
