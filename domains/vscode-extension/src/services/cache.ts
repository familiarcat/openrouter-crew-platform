import * as vscode from 'vscode';
import * as crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiry: number;
}

export class ResponseCache {
  private context: vscode.ExtensionContext;
  private static readonly CACHE_PREFIX = 'openrouter-crew.cache.';
  private static readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Generates a unique key based on the prompt content
   */
  public generateKey(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Retrieves a cached response if it exists and is valid
   */
  public get<T>(key: string): T | undefined {
    const storageKey = this.getStorageKey(key);
    const entry = this.context.globalState.get<CacheEntry<T>>(storageKey);

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiry) {
      // Expired, clean up
      this.context.globalState.update(storageKey, undefined);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Caches a response with an expiration time
   */
  public async set<T>(key: string, value: T, ttlMs: number = ResponseCache.DEFAULT_EXPIRY): Promise<void> {
    const storageKey = this.getStorageKey(key);
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs
    };

    await this.context.globalState.update(storageKey, entry);
  }

  /**
   * Clears a specific cache entry
   */
  public async clear(key: string): Promise<void> {
    const storageKey = this.getStorageKey(key);
    await this.context.globalState.update(storageKey, undefined);
  }

  /**
   * Clears all cache entries
   */
  public async clearAll(): Promise<void> {
    const keys = this.context.globalState.keys();
    for (const key of keys) {
      if (key.startsWith(ResponseCache.CACHE_PREFIX)) {
        await this.context.globalState.update(key, undefined);
      }
    }
  }

  private getStorageKey(key: string): string {
    return `${ResponseCache.CACHE_PREFIX}${key}`;
  }
}