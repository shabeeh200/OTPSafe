"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRequest = analyzeRequest;
const ruleEngine_1 = require("../controller/logic/ruleEngine");
const cacheService_1 = require("./cacheService");
const queueService_1 = require("./queueService");
const crypto_1 = __importDefault(require("crypto"));
function makeKey(sender, message) {
    return 'scam:verdict:' + crypto_1.default.createHash('sha256').update(`${sender}::${message}`).digest('hex');
}
/**
 * Safer escalation policy:
 * - If rule confidence >= INSTANT_THRESHOLD => return rules (flag)
 * - If rule confidence < LOW_THRESHOLD => return rules (safe)
 * - Only when LOW_THRESHOLD <= confidence < INSTANT_THRESHOLD AND
 *   at least one rule triggered => enqueue to LLM
 */
// src/services/analysisService.ts
// ----- REPLACE analyzeRequest FUNCTION WITH THIS -----
async function analyzeRequest(req) {
    const message = (req.message || '').trim();
    const sender = req.sender || '';
    const country = req.country || 'PK';
    const key = makeKey(sender, message);
    // run rule-engine
    const ruleResult = (0, ruleEngine_1.analyzeSms)({ message, sender, country });
    // safe cutoff: don't call LLM for clearly-benign texts (saves cost)
    const SAFE_CUTOFF = Number(process.env.RULES_SAFE_CUTOFF || 0.2);
    if (ruleResult.confidence < SAFE_CUTOFF) {
        const redacted = (0, ruleEngine_1.redactPII)(message);
        const resp = {
            ...ruleResult,
            redacted,
            source: 'rules'
        };
        // best-effort cache the safe verdict (so duplicates are fast)
        try {
            await (0, cacheService_1.setCached)(key, resp);
        }
        catch (_) { /* ignore cache errors */ }
        return resp;
    }
    // instant return when rules are highly confident (scam)
    const instantThreshold = Number(process.env.RULES_INSTANT_THRESHOLD || 0.8);
    if (ruleResult.confidence >= instantThreshold) {
        const redacted = (0, ruleEngine_1.redactPII)(message);
        const resp = { ...ruleResult, redacted, source: 'rules' };
        try {
            await (0, cacheService_1.setCached)(key, resp);
        }
        catch (_) { /* ignore cache errors */ }
        return resp;
    }
    // check cache
    const cached = await (0, cacheService_1.getCached)(key);
    if (cached)
        return { ...cached, source: 'cache' };
    // enqueue job for deeper analysis (job must include id so queueService can dedupe)
    const job = { id: key, sender, message: (0, ruleEngine_1.redactPII)(message), meta: { country } };
    const ok = await (0, queueService_1.enqueueJob)('scam:queue', job);
    if (!ok) {
        return {
            ...ruleResult,
            redacted: (0, ruleEngine_1.redactPII)(message),
            source: 'llm_pending',
            llmExplanation: 'Failed to enqueue job for LLM processing; will retry later.'
        };
    }
    return {
        ...ruleResult,
        redacted: (0, ruleEngine_1.redactPII)(message),
        source: 'llm_pending',
        llmExplanation: 'Queued for deeper analysis. Result will appear when processed.'
    };
}
//# sourceMappingURL=analysisService.js.map