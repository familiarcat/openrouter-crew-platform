export class ResponseCache {
    generateKey(input: string): string {
        return Buffer.from(input).toString('base64');
    }

    get<T>(key: string): T | undefined {
        return undefined;
    }

    async set(key: string, value: any): Promise<void> {
        // No-op
    }
}