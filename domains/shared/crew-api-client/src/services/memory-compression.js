/// <reference types="node" />
import { gzipSync, gunzipSync } from 'zlib';
/**
 * A simple service for compressing and decompressing memory content.
 * Uses gzip for effective text compression.
 */
export class MemoryCompressionService {
    /**
     * Compresses a string using gzip and encodes it to base64.
     * @param content The string content to compress.
     * @returns A base64 encoded compressed string.
     */
    compress(content) {
        return gzipSync(content).toString('base64');
    }
    /**
     * Decompresses a base64 encoded string that was compressed with gzip.
     * @param compressedContent The base64 encoded compressed string.
     * @returns The original decompressed string.
     */
    decompress(compressedContent) {
        const buffer = Buffer.from(compressedContent, 'base64');
        return gunzipSync(buffer).toString();
    }
}
//# sourceMappingURL=memory-compression.js.map