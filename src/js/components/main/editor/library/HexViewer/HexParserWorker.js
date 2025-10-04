// HexParserWorker.js - Web Worker for non-blocking hex data parsing
"use strict";

// Message types
const MESSAGE_TYPES = {
    PARSE_DATA: 'PARSE_DATA',
    CHUNK_PARSED: 'CHUNK_PARSED',
    ERROR: 'ERROR',
    COMPLETE: 'COMPLETE',
    ABORT: 'ABORT'
};

// Configuration
const DEFAULT_CHUNK_SIZE = 65536; // 64KB chunks for processing
const BATCH_DELAY = 0; // ms delay between batches for UI responsiveness

// Global abort controller for current operation
let currentAbortController = null;

function parseDataInChunks(data, encoding, rowLength, setLength) {
    return new Promise((resolve, reject) => {
        currentAbortController = { abort: false };

        try {
            let bufferData = [];
            let rawData;

            // Parse input data based on encoding
            if (encoding === 'hex') {
                rawData = Buffer.from(data, "hex");
            } else if (encoding === 'base64') {
                rawData = Buffer.from(data, "base64");
            } else {
                rawData = data;
            }

            rawData = rawData || [];
            const bytes = rawData.length;

            // Convert buffer to array if needed
            if (Buffer.isBuffer(rawData)) {
                for (let i = 0; i < bytes; i++) {
                    bufferData.push(rawData[i]);
                }
            } else {
                bufferData = rawData;
            }

            // Process data in chunks
            const totalChunks = Math.ceil(bytes / DEFAULT_CHUNK_SIZE);
            let processedChunks = 0;
            let allRows = [];

            function processNextChunk() {
                if (currentAbortController.abort) {
                    postMessage({
                        type: MESSAGE_TYPES.ABORT,
                        payload: { message: 'Operation aborted' }
                    });
                    return;
                }

                const start = processedChunks * DEFAULT_CHUNK_SIZE;
                const end = Math.min(start + DEFAULT_CHUNK_SIZE, bytes);
                const chunk = bufferData.slice(start, end);

                // Parse this chunk into rows
                const chunkRows = parseChunkToRows(chunk, rowLength, setLength, start);

                // Add to accumulated results
                allRows.push(...chunkRows);

                processedChunks++;

                // Send progress update
                postMessage({
                    type: MESSAGE_TYPES.CHUNK_PARSED,
                    payload: {
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
                    postMessage({
                        type: MESSAGE_TYPES.COMPLETE,
                        payload: {
                            totalRows: allRows.length,
                            totalBytes: bytes
                        }
                    });
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
                        rows: [],
                        chunkIndex: 1,
                        totalChunks: 1,
                        isComplete: true
                    }
                });
                postMessage({
                    type: MESSAGE_TYPES.COMPLETE,
                    payload: {
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
    const { type, payload } = e.data;

    switch (type) {
        case MESSAGE_TYPES.PARSE_DATA:
            currentAbortController = { abort: false };
            parseDataInChunks(
                payload.data,
                payload.encoding,
                payload.rowLength,
                payload.setLength
            ).catch(error => {
                // Error already handled in parseDataInChunks
            });
            break;

        case MESSAGE_TYPES.ABORT:
            if (currentAbortController) {
                currentAbortController.abort = true;
            }
            break;

        default:
            postMessage({
                type: MESSAGE_TYPES.ERROR,
                payload: {
                    message: `Unknown message type: ${type}`
                }
            });
    }
};

// Export for use as module if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MESSAGE_TYPES };
}
