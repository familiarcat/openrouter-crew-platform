/**
 * A simple service for compressing and decompressing memory content.
 * Uses gzip for effective text compression.
 */
export declare class MemoryCompressionService {
    /**
     * Compresses a string using gzip and encodes it to base64.
     * @param content The string content to compress.
     * @returns A base64 encoded compressed string.
     */
    compress(content: string): string;
    /**
     * Decompresses a base64 encoded string that was compressed with gzip.
     * @param compressedContent The base64 encoded compressed string.
     * @returns The original decompressed string.
     */
    decompress(compressedContent: string): string;
}
//# sourceMappingURL=memory-compression.d.ts.map