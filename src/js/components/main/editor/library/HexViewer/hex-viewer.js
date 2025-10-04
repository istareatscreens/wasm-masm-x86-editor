"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexViewer = void 0;
var tslib_1 = require("tslib");
var react_1 = tslib_1.__importStar(require("react"));
var hex_1 = require("./hex");
var WorkerController_1 = require("./WorkerController");

var HexViewer = function (props) {
    var _a = props.rowLength, rowLength = _a === void 0 ? 16 : _a, _b = props.setLength, setLength = _b === void 0 ? 4 : _b, children = props.children, base64 = props.base64, hex = props.hex, noData = props.noData, errorData = props.errorData;

    // State for worker results
    var _c = react_1.useState([]), rows = _c[0], setRows = _c[1];
    var _d = react_1.useState(false), isErrorData = _d[0], setIsErrorData = _d[1];
    var _e = react_1.useState(false), isLoading = _e[0], setIsLoading = _e[1];
    var _f = react_1.useState(0), processedChunks = _f[0], setProcessedChunks = _f[1];
    var _g = react_1.useState(0), totalChunks = _g[0], setTotalChunks = _g[1];

    // Refs for cleanup
    var workerControllerRef = react_1.useRef(null);
    var currentDataRef = react_1.useRef(null);
    var abortControllerRef = react_1.useRef(null);

    // Get encoding type
    var getEncoding = react_1.useCallback(function() {
        if (hex) return 'hex';
        if (base64) return 'base64';
        return 'raw';
    }, [hex, base64]);

    // Batched state update to improve performance - increased batch time for better performance
    var batchedUpdateRef = react_1.useRef(null);
    var pendingRowsRef = react_1.useRef([]);

    var updateRowsBatched = react_1.useCallback(function(newChunkRows) {
        if (batchedUpdateRef.current) {
            clearTimeout(batchedUpdateRef.current);
        }

        // Accumulate rows instead of updating immediately
        pendingRowsRef.current.push(...newChunkRows);

        batchedUpdateRef.current = setTimeout(function() {
            if (pendingRowsRef.current.length > 0) {
                setRows(function(prevRows) { return prevRows.concat(pendingRowsRef.current); });
                pendingRowsRef.current = []; // Clear accumulated rows
            }
        }, 100); // 100ms batching for better performance
    }, []);

    // Process data with worker
    var processData = react_1.useCallback(function(dataToProcess) {
        if (!dataToProcess || dataToProcess.length === 0) {
            setRows([]);
            setIsErrorData(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsErrorData(false);
        setProcessedChunks(0);

        // Create new abort controller for this operation
        abortControllerRef.current = { aborted: false };

        // Get worker controller (reuse existing instance)
        if (!workerControllerRef.current) {
            workerControllerRef.current = new WorkerController_1.WorkerController();
            workerControllerRef.current.initialize();
        }

        // Clear previous results
        setRows([]);

        var encoding = getEncoding();

        console.log('HexViewer starting new operation with data length:', dataToProcess.length, 'encoding:', encoding);

        // Process with streaming updates
        workerControllerRef.current.parseDataWithCallback(
            dataToProcess,
            encoding,
            rowLength,
            setLength,
            function(payload) {
                // Check if operation was aborted
                if (abortControllerRef.current && abortControllerRef.current.aborted) {
                    console.log('HexViewer operation was aborted, ignoring chunk');
                    return;
                }

                console.log('HexViewer received chunk:', payload.chunkIndex, 'of', payload.totalChunks, 'with', payload.rows?.length || 0, 'rows');

                if (payload.rows && payload.rows.length > 0) {
                    updateRowsBatched(payload.rows);
                }

                setProcessedChunks(payload.chunkIndex);
                setTotalChunks(payload.totalChunks);

                if (payload.isComplete) {
                    console.log('HexViewer operation completed');
                    setIsLoading(false);
                }
            }
        ).then(function(result) {
            // Operation completed successfully
            if (abortControllerRef.current && !abortControllerRef.current.aborted) {
                console.log('HexViewer promise resolved successfully');
                setIsLoading(false);
            } else {
                console.log('HexViewer promise resolved but operation was aborted');
            }
        }).catch(function(error) {
            // Handle errors
            if (abortControllerRef.current && !abortControllerRef.current.aborted) {
                console.error('HexViewer processing error:', error);
                setIsErrorData(true);
                setRows([]);
                setIsLoading(false);
            } else {
                console.log('HexViewer error but operation was aborted:', error.message);
            }
        });
    }, [rowLength, setLength, getEncoding, updateRowsBatched]);

    // Effect to process data when inputs change
    react_1.useEffect(function() {
        // Create a hash of current data for comparison
        var currentDataHash = JSON.stringify({
            children: children,
            base64: base64,
            hex: hex,
            rowLength: rowLength,
            setLength: setLength
        });

        console.log('HexViewer useEffect triggered, data hash:', currentDataHash.substring(0, 50) + '...');

        // Skip if data hasn't changed
        if (currentDataHash === currentDataRef.current) {
            console.log('HexViewer data unchanged, skipping');
            return;
        }

        console.log('HexViewer data changed, starting new processing');
        currentDataRef.current = currentDataHash;

        // Abort previous operation if still running
        if (abortControllerRef.current) {
            console.log('HexViewer aborting previous operation');
            abortControllerRef.current.aborted = true;
            // Also abort the worker operation
            if (workerControllerRef.current) {
                // We need to track the current operation ID to abort it properly
                // For now, we'll abort all operations in the worker
                workerControllerRef.current.abortAll();
            }
        }

        // Start new processing
        processData(children);

        // Cleanup function
        return function() {
            if (batchedUpdateRef.current) {
                clearTimeout(batchedUpdateRef.current);
            }
            // Flush any pending rows on cleanup
            if (pendingRowsRef.current.length > 0) {
                setRows(function(prevRows) { return prevRows.concat(pendingRowsRef.current); });
                pendingRowsRef.current = [];
            }
        };
    }, [children, base64, hex, rowLength, setLength, processData]);

    // Cleanup on unmount
    react_1.useEffect(function() {
        return function() {
            if (batchedUpdateRef.current) {
                clearTimeout(batchedUpdateRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.aborted = true;
            }
            if (workerControllerRef.current) {
                workerControllerRef.current.destroy();
            }
            // Flush any remaining pending rows
            if (pendingRowsRef.current.length > 0) {
                setRows(function(prevRows) { return prevRows.concat(pendingRowsRef.current); });
                pendingRowsRef.current = [];
            }
        };
    }, []);

    // Determine what to render
    var shouldShowError = isErrorData && !isLoading;
    var shouldShowNoData = !isLoading && !isErrorData && rows.length === 0 && processedChunks === 0;
    var shouldShowData = !isLoading && !isErrorData && rows.length > 0;

    return (react_1.default.createElement(react_1.default.Fragment, null,
        // Show loading indicator during processing
        isLoading && react_1.default.createElement("div", { className: "hexviewer-loading" },
            "Processing data... (",
            processedChunks,
            "/",
            totalChunks,
            " chunks) - ",
            rows.length,
            " rows rendered"),

        // Show error state
        shouldShowError && (errorData || react_1.default.createElement("div", null, "Error processing data")),

        // Show no data state
        shouldShowNoData && (noData || react_1.default.createElement("div", null, "No data to display")),

        // Show hex data
        shouldShowData && (react_1.default.createElement(hex_1.Hex, { rows: rows, bytesper: rowLength }))));
};

exports.HexViewer = HexViewer;
