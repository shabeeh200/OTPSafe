"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/worker/worker.ts
const redisService_1 = require("../services/redisService");
const geminiService_1 = require("../services/geminiService");
const cacheService_1 = require("../services/cacheService");
const pg_1 = require("pg");
const queueService_1 = require("../services/queueService");
const DATABASE_URL = process.env.DATABASE_URL;
const pg = DATABASE_URL ? new pg_1.Client({ connectionString: DATABASE_URL }) : null;
async function saveToDb(id, sender, message, verdict, confidence, explanation) {
    if (!pg) {
        // db not configured — skip
        return;
    }
    try {
        await pg.query(`INSERT INTO verdicts(id, sender, message, verdict, confidence, explanation, created_at, updated_at)
       VALUES($1,$2,$3,$4,$5,$6,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET verdict = EXCLUDED.verdict, confidence = EXCLUDED.confidence, explanation = EXCLUDED.explanation, updated_at = NOW()`, [id, sender, message, verdict, confidence, explanation]);
    }
    catch (e) {
        console.error('saveToDb failed', e);
    }
}
async function processRaw(raw) {
    let job;
    try {
        job = JSON.parse(raw);
    }
    catch (e) {
        console.error('Invalid job payload', raw, e);
        // push raw to failed queue for manual inspection
        try {
            await redisService_1.redis.rpush('scam:failed', raw);
        }
        catch (_) { }
        return;
    }
    const { id, sender = '', message } = job;
    // inside processRaw (after ai analysis and before finishing)
    try {
        const ai = await (0, geminiService_1.analyzeWithGemini)(message); // message is already redacted from job
        const response = {
            isScam: ai.verdict === 'scam',
            confidence: ai.confidence,
            reasons: [ai.explanation],
            suggestedAction: ai.verdict === 'scam' ? ['report_to_provider'] : ['monitor'],
            triggeredRules: [],
            redacted: message,
            llmExplanation: ai.explanation,
            source: 'llm'
        };
        // cache result
        await (0, cacheService_1.setCached)(id, response);
        // persist (use redacted message explicitly)
        await saveToDb(id, sender, message, ai.verdict, ai.confidence, ai.explanation);
        // remove dedupe so identical messages can be reprocessed later if needed
        try {
            await (0, queueService_1.removeDedup)(id);
        }
        catch (e) {
            console.warn('removeDedup warning', e);
        }
    }
    catch (e) {
        console.error('processRaw error', e);
        try {
            await redisService_1.redis.rpush('scam:failed', raw);
        }
        catch (ie) {
            console.error('failed to push failed job', ie);
        }
    }
}
async function main() {
    if (pg) {
        try {
            await pg.connect();
            console.log('Worker connected to Postgres');
        }
        catch (e) {
            console.warn('Worker DB connect failed, continuing without DB', e);
        }
    }
    else {
        console.log('DATABASE_URL not provided; worker will not persist to DB.');
    }
    console.log('Worker starting; listening for jobs on scam:queue');
    while (true) {
        try {
            // blocking pop. Works with real Redis; our in-memory fallback has a naive blpop impl for local dev.
            const res = await redisService_1.redis.blpop('scam:queue', 0);
            const raw = Array.isArray(res) ? res[1] : res;
            if (raw)
                await processRaw(raw);
        }
        catch (e) {
            console.error('Worker loop error', e);
            // backoff on error
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}
main().catch(err => {
    console.error('Worker crashed', err);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map