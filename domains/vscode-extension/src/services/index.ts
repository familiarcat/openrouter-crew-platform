import Redis, { RedisOptions } from 'ioredis';

/**
 * Centralized Redis Client (The Warp Core Interface)
 * Manages shared connection pooling and configuration across the monorepo.
 */
export class RedisClient {
    private static instance: Redis | null = null;

    public static getInstance(options?: RedisOptions): Redis {
        if (!this.instance) {
            const redisPassword = process.env.REDIS_PASSWORD || 'redis';
            const redisHost = process.env.REDIS_HOST || 'localhost';
            const redisPort = Number(process.env.REDIS_PORT) || 6379;

            console.log(`[RedisClient] Initializing connection to ${redisHost}:${redisPort}`);

            this.instance = new Redis({
                host: redisHost,
                port: redisPort,
                password: redisPassword,
                retryStrategy: (times) => Math.min(times * 50, 2000),
                ...options
            });

            this.instance.on('error', (err) => {
                console.error('[RedisClient] Connection Error:', err.message);
            });
        }
        return this.instance;
    }

    public static async shutdown(): Promise<void> {
        if (this.instance) {
            await this.instance.quit();
            this.instance = null;
        }
    }
}

export default RedisClient;