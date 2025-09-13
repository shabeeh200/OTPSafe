// src/services/redisClient.ts
import Redis from 'ioredis';

/**
 * Minimal in-memory fallback store for local dev.
 * Note: this fallback does NOT implement blocking pop (BLPOP) reliably
 * and is NOT intended for production. Use a real Redis for worker.
 */
function createInMemoryStore() {
  const map = new Map<string, string>();
  const queue: string[] = [];
  return {
    async get(k: string) { return map.get(k) ?? null; },
    async set(k: string, v: string, _mode?: string, _ttl?: number) { map.set(k, v); return 'OK'; },
    async rpush(_list: string, val: string) { queue.push(val); return queue.length; },
    // For worker local testing only: simple pop
    async blpop(list: string, _timeout: number) {
      if (queue.length === 0) return null;
      const val = queue.shift();
      return val ? [list, val] : null;
    },
    async rpushRaw(list: string, val: string) { queue.push(val); return queue.length; }
  } as const;
}

const redisUrl = process.env.REDIS_URL;
export const redis = (() => {
  if (redisUrl && redisUrl.length) {
    // pass URL string — ioredis handles it
    return new Redis(redisUrl);
  }
  console.warn('REDIS_URL not found — using in-memory fallback (dev only).');
  return createInMemoryStore();
})();
