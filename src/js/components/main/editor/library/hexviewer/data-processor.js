// Constants for data processing
const CHUNK_SIZE = 1024 * 64; // 64KB chunks for better performance

/**
 * DataProcessor - Optimized for performance and future WASM integration
 * All methods use typed arrays and efficient algorithms that can be
 * easily replaced with WASM implementations
 */
export class DataProcessor {
    /**
     * Process data efficiently - can be replaced with WASM in the future
     * @param {Uint8Array|Array|string} data - Input data
     * @returns {Uint8Array} Processed data as typed array
     */
    static processData(data) {
        if (!data) return new Uint8Array(0);
        
        // Convert to Uint8Array if needed
        if (data instanceof Uint8Array) {
            return data;
        }
        if (Array.isArray(data)) {
            return new Uint8Array(data);
        }
        if (typeof data === 'string') {
            // Assume hex string
            const bytes = new Uint8Array(data.length / 2);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = parseInt(data.substr(i * 2, 2), 16);
            }
            return bytes;
        }
        
        return new Uint8Array(0);
    }

    /**
     * Create chunks from data - WASM-ready structure
     * @param {Uint8Array} data - Input data
     * @returns {Array<Uint8Array>} Array of data chunks
     */
    static createChunks(data) {
        if (!data || data.length === 0) return [];
        
        const numChunks = Math.ceil(data.length / CHUNK_SIZE);
        const chunks = new Array(numChunks);
        
        for (let i = 0; i < numChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, data.length);
            chunks[i] = data.slice(start, end);
        }
        
        return chunks;
    }

    /**
     * Process chunks with progress tracking - can be replaced with WASM batch processing
     * @param {Array<Uint8Array>} chunks - Data chunks
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Uint8Array>} Accumulated result
     */
    static async processChunks(chunks, onProgress) {
        if (!chunks || chunks.length === 0) {
            return new Uint8Array(0);
        }
        
        // Calculate total size and pre-allocate result
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalSize);
        
        let offset = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            result.set(chunk, offset);
            offset += chunk.length;
            
            if (onProgress) {
                onProgress(Math.round((i + 1) / chunks.length * 100));
            }
            
            // Allow UI to update every 10 chunks or on last chunk
            if (i % 10 === 0 || i === chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        return result;
    }

    /**
     * Convert byte array to hex string - optimized and WASM-ready
     * @param {Uint8Array} data - Input data
     * @returns {string} Hex string
     */
    static toHexString(data) {
        if (!data || data.length === 0) return '';
        
        const hexChars = new Array(data.length * 2);
        const hexDigits = '0123456789abcdef';
        
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            hexChars[i * 2] = hexDigits[byte >> 4];
            hexChars[i * 2 + 1] = hexDigits[byte & 0x0f];
        }
        
        return hexChars.join('');
    }

    /**
     * Convert hex string to byte array - optimized and WASM-ready
     * @param {string} hexString - Hex string input
     * @returns {Uint8Array} Byte array
     */
    static fromHexString(hexString) {
        if (!hexString || hexString.length === 0) return new Uint8Array(0);
        
        // Remove any spaces or non-hex characters
        const cleaned = hexString.replace(/[^0-9a-fA-F]/g, '');
        const bytes = new Uint8Array(cleaned.length / 2);
        
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
        }
        
        return bytes;
    }
}
