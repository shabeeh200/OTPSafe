"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
// src/services/redisClient.ts
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Minimal in-memory fallback store for local dev.
 * Note: this fallback does NOT implement blocking pop (BLPOP) reliably
 * and is NOT intended for production. Use a real Redis for worker.
 */
function createInMemoryStore() {
    const map = new Map();
    const queue = [];
    return {
        async get(k) { return map.get(k) ?? null; },
        async set(k, v, _mode, _ttl) { map.set(k, v); return 'OK'; },
        async rpush(_list, val) { queue.push(val); return queue.length; },
        // For worker local testing only: simple pop
        async blpop(list, _timeout) {
            if (queue.length === 0)
                return null;
            const val = queue.shift();
            return val ? [list, val] : null;
        },
        async rpushRaw(list, val) { queue.push(val); return queue.length; }
    };
}
const redisUrl = process.env.REDIS_URL;
exports.redis = (() => {
    if (redisUrl && redisUrl.length) {
        // pass URL string — ioredis handles it
        return new ioredis_1.default(redisUrl);
    }
    console.warn('REDIS_URL not found — using in-memory fallback (dev only).');
    return createInMemoryStore();
})();
//# sourceMappingURL=redisService.js.map