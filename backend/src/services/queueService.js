"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueJob = enqueueJob;
exports.removeDedup = removeDedup;
// src/services/queueService.ts
const redisService_1 = require("./redisService");
const DEDUP_SET = 'scam:dedup';
async function enqueueJob(listName, job) {
    try {
        // job.id must exist and be the dedupe key (analysisService sets it)
        const jobId = job.id;
        if (!jobId) {
            console.warn('enqueueJob: job missing id, refusing to enqueue to avoid duplicates');
            return false;
        }
        // Try to add to dedupe set. SADD returns number of elements added (0 if already present)
        const added = await redisService_1.redis.sadd(DEDUP_SET, jobId);
        if (!added) {
            // Already enqueued/processing recently
            return false;
        }
        // safe push to queue
        await redisService_1.redis.rpush(listName, JSON.stringify(job));
        return true;
    }
    catch (e) {
        console.error('enqueueJob failed', e);
        return false;
    }
}
async function removeDedup(jobId) {
    try {
        await redisService_1.redis.srem(DEDUP_SET, jobId);
    }
    catch (e) {
        console.warn('removeDedup failed', e);
    }
}
//# sourceMappingURL=queueService.js.map