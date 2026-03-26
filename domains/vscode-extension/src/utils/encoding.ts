/**
 * Safe Encoding Utilities
 * 
 * Replacement for legacy btoa()/atob() which fail on high-byte characters (emojis).
 * Uses Node.js native Buffers for safe UTF-8 handling.
 * 
 * @module utils/encoding
 */

/**
 * Safely encodes a UTF-8 string to Base64.
 * Handles emojis (✅) and other multi-byte characters correctly.
 */
export function safeBase64Encode(text: string): string {
    return Buffer.from(text, 'utf-8').toString('base64');
}

/**
 * Safely decodes a Base64 string to UTF-8.
 */
export function safeBase64Decode(base64: string): string {
    return Buffer.from(base64, 'base64').toString('utf-8');
}