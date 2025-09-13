// src/services/analysisService.ts
import { AnalyzeSmsRequest, AnalyzeSmsResponse } from '../types';
import { analyzeSms as runRules, redactPII } from '../controller/logic/ruleEngine';
import { getCached, setCached } from './cacheService';
import { enqueueJob } from './queueService';
import crypto from 'crypto';

function makeKey(sender: string, message: string) {
  return 'scam:verdict:' + crypto.createHash('sha256').update(`${sender}::${message}`).digest('hex');
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
export async function analyzeRequest(req: AnalyzeSmsRequest): Promise<AnalyzeSmsResponse> {
  const message = (req.message || '').trim();
  const sender = req.sender || '';
  const country = req.country || 'PK';
  const key = makeKey(sender, message);

  // run rule-engine
  const ruleResult = runRules({ message, sender, country });

  // safe cutoff: don't call LLM for clearly-benign texts (saves cost)
  const SAFE_CUTOFF = Number(process.env.RULES_SAFE_CUTOFF || 0.2);
  if (ruleResult.confidence < SAFE_CUTOFF) {
    const redacted = redactPII(message);
    const resp: AnalyzeSmsResponse = {
      ...ruleResult,
      redacted,
      source: 'rules'
    };
    // best-effort cache the safe verdict (so duplicates are fast)
    try { await setCached(key, resp); } catch (_) { /* ignore cache errors */ }
    return resp;
  }

  // instant return when rules are highly confident (scam)
  const instantThreshold = Number(process.env.RULES_INSTANT_THRESHOLD || 0.8);
  if (ruleResult.confidence >= instantThreshold) {
    const redacted = redactPII(message);
    const resp: AnalyzeSmsResponse = { ...ruleResult, redacted, source: 'rules' };
    try { await setCached(key, resp); } catch (_) { /* ignore cache errors */ }
    return resp;
  }

  // check cache
  const cached = await getCached(key);
  if (cached) return { ...cached, source: 'cache' };

  // enqueue job for deeper analysis (job must include id so queueService can dedupe)
  const job = { id: key, sender, message: redactPII(message), meta: { country } };
  const ok = await enqueueJob('scam:queue', job);
  if (!ok) {
    return {
      ...ruleResult,
      redacted: redactPII(message),
      source: 'llm_pending',
      llmExplanation: 'Failed to enqueue job for LLM processing; will retry later.'
    };
  }

  return {
    ...ruleResult,
    redacted: redactPII(message),
    source: 'llm_pending',
    llmExplanation: 'Queued for deeper analysis. Result will appear when processed.'
  };
}

