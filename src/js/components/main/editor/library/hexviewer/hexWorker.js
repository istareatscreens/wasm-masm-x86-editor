// Pre-computed hex lookup table for faster conversion
const HEX_LOOKUP = new Array(256);
for (let i = 0; i < 256; i++) {
    HEX_LOOKUP[i] = i.toString(16).padStart(2, '0');
}

// Optimized byte to hex conversion using lookup table
const byteToHex = byte => HEX_LOOKUP[byte];

const processRows = (data, rowLength, setLength) => {
    const totalBytes = data.length;
    const totalRows = Math.ceil(totalBytes / rowLength);
    const rows = new Array(totalRows); // Pre-allocate array
    const reportInterval = Math.max(1000, Math.floor(totalBytes / 100)); // Report every 1% or 1000 bytes minimum
    let lastReportedPercent = 0;

    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const i = rowIndex * rowLength;
        const setsPerRow = Math.ceil(Math.min(rowLength, totalBytes - i) / setLength);
        const rowData = new Array(setsPerRow); // Pre-allocate row array
        
        for (let setIndex = 0; setIndex < setsPerRow; setIndex++) {
            const j = setIndex * setLength;
            const bytesInSet = Math.min(setLength, totalBytes - (i + j));
            const set = new Array(bytesInSet); // Pre-allocate set array
            
            for (let k = 0; k < bytesInSet; k++) {
                set[k] = byteToHex(data[i + j + k]);
            }
            rowData[setIndex] = set;
        }
        rows[rowIndex] = rowData;

        // Report progress less frequently to avoid overhead
        if (i % reportInterval === 0 || rowIndex === totalRows - 1) {
            const currentPercent = Math.min(100, Math.round((rowIndex / totalRows) * 100));
            if (currentPercent > lastReportedPercent) {
                self.postMessage({ type: 'progress', percent: currentPercent });
                lastReportedPercent = currentPercent;
            }
        }
    }

    return rows;
};

// Worker message handler
self.onmessage = (e) => {
    try {
        const { buffer, rowLength, setLength } = e.data;
        
        // Validate inputs
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
            throw new Error('Invalid buffer provided');
        }
        if (!rowLength || rowLength <= 0) {
            throw new Error('Invalid rowLength provided');
        }
        if (!setLength || setLength <= 0) {
            throw new Error('Invalid setLength provided');
        }
        
        const data = new Uint8Array(buffer);
        const rows = processRows(data, rowLength, setLength);
        self.postMessage({ type: 'done', rows });
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
};
