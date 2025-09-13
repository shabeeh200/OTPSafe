"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCached = getCached;
exports.setCached = setCached;
// src/services/cacheService.ts
const redisService_1 = require("./redisService");
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SEC || 60 * 60 * 24 * 7); // 7 days
async function getCached(key) {
    try {
        const raw = await redisService_1.redis.get(key);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch (e) {
            console.warn('getCached: invalid JSON stored in cache for', key, e);
            return null;
        }
    }
    catch (e) {
        console.warn('getCached: redis error', e);
        return null;
    }
}
async function setCached(key, payload, ttl = DEFAULT_TTL) {
    try {
        // using EX in ioredis param style
        await redisService_1.redis.set(key, JSON.stringify(payload), 'EX', ttl);
    }
    catch (e) {
        console.warn('setCached: redis error', e);
    }
}
//# sourceMappingURL=cacheService.js.map