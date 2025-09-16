// src/services/analysisService.ts
import { AnalyzeSmsRequest, AnalyzeSmsResponse, TriggeredRule } from '../../types';
import { analyzeSms as runRules, redactPII } from '../rules/ruleEngine';
import { analyzeWithGemini } from './geminiService';

const SAFE_CUTOFF = Number(process.env.RULES_SAFE_CUTOFF || 0.2);
const INSTANT_THRESHOLD = Number(process.env.RULES_INSTANT_THRESHOLD || 0.8);
const LLM_DECISION_CONFIDENCE = Number(process.env.LLM_DECISION_CONFIDENCE || 0.75);

// Additional conservative escalation controls (tune via env)
const MIN_MESSAGE_LENGTH_FOR_LLM = Number(process.env.MIN_MESSAGE_LENGTH_FOR_LLM || 20);
const MIN_SUM_WEIGHTS_FOR_LLM = Number(process.env.MIN_SUM_WEIGHTS_FOR_LLM || 0.6);
const MIN_MAX_WEIGHT_FOR_LLM = Number(process.env.MIN_MAX_WEIGHT_FOR_LLM || 0.6);

export async function analyzeRequest(req: AnalyzeSmsRequest): Promise<AnalyzeSmsResponse> {
  const message = (req.message || '').trim();
  const sender = req.sender || '';
  const country = req.country || 'PK';

  // 1) Run rule-engine (fast, local)
  const ruleResult = runRules({ message, sender, country });

  // redacted message (never return or send raw)
  const redacted = redactPII(message);

  // 2) SAFE cutoff: do NOT call LLM for clearly benign messages
  if (ruleResult.confidence < SAFE_CUTOFF) {
    return {
      ...ruleResult,
      redacted,
      source: 'rules'
    };
  }

  // 3) Instant rules: high-confidence scam -> return immediately
  if (ruleResult.confidence >= INSTANT_THRESHOLD) {
    return {
      ...ruleResult,
      redacted,
      source: 'rules'
    };
  }

  // 4) Mid-confidence: decide whether to escalate to LLM based on more robust signals
  const triggered: TriggeredRule[] = Array.isArray(ruleResult.triggeredRules)
    ? (ruleResult.triggeredRules as TriggeredRule[])
    : [];

  const sumWeights = triggered.reduce((s, r) => s + (typeof r.weight === 'number' ? r.weight : 0), 0);
  const maxWeight = triggered.length ? Math.max(...triggered.map(r => (typeof r.weight === 'number' ? r.weight : 0))) : 0;

  const hasMeaningfulSignal =
    triggered.length > 0 &&
    (sumWeights >= MIN_SUM_WEIGHTS_FOR_LLM || maxWeight >= MIN_MAX_WEIGHT_FOR_LLM) &&
    message.length >= MIN_MESSAGE_LENGTH_FOR_LLM;

  if (!hasMeaningfulSignal) {
    // conservative default: do not escalate; return rule-only result
    console.debug('analysisService: not escalating to LLM — insufficient signals', {
      sumWeights,
      maxWeight,
      triggeredCount: triggered.length,
      messageLength: message.length
    });
    return {
      ...ruleResult,
      redacted,
      source: 'rules'
    };
  }

  // 5) If we reach here, rule signals justify an LLM call (protected by LLM timeouts/retries)
  try {
    const ai = await analyzeWithGemini(redacted); // { explanation, verdict, confidence }

    // conservative combine:
    // - default: keep ruleResult.isScam
    // - only flip to scam if LLM verdict is 'scam' AND model confidence >= threshold
    let finalIsScam = ruleResult.isScam;
    if (ai.verdict === 'scam' && ai.confidence >= LLM_DECISION_CONFIDENCE) {
      finalIsScam = true;
    }

    const finalConfidence = Number(Math.max(ruleResult.confidence, ai.confidence || 0).toFixed(3));

    // build reasons: include top LLM line as hint
    const aiFirstLine = ai.explanation ? ai.explanation.split('\n')[0] : '';
    const reasons = Array.isArray(ruleResult.reasons) ? ruleResult.reasons.slice() : [];
    if (aiFirstLine) reasons.push(`LLM: ${aiFirstLine}`);

    const suggestedAction = finalIsScam ? ['report_to_provider'] : ['monitor'];

    const response: AnalyzeSmsResponse = {
      isScam: finalIsScam,
      confidence: finalConfidence,
      reasons,
      suggestedAction,
      triggeredRules: triggered,
      redacted,
      llmExplanation: ai.explanation,
      source: 'llm'
    };

    return response;
  } catch (err) {
    console.error('analysisService: Gemini call failed', err);
    // fallback: return safe rule-only result (redacted) and note LLM failure
    return {
      ...ruleResult,
      redacted,
      llmExplanation: 'LLM unavailable; returned rule-only result',
      source: 'rules'
    };
  }
}

// // src/services/analysisService.ts
// import { AnalyzeSmsRequest, AnalyzeSmsResponse, TriggeredRule } from '../../types';
// import { analyzeSms as runRules, redactPII } from '../rules/ruleEngine';
// import { analyzeWithGemini } from './geminiService';

// const SAFE_CUTOFF = Number(process.env.RULES_SAFE_CUTOFF || 0.2);
// const INSTANT_THRESHOLD = Number(process.env.RULES_INSTANT_THRESHOLD || 0.8);
// const LLM_DECISION_CONFIDENCE = Number(process.env.LLM_DECISION_CONFIDENCE || 0.75);

// /**
//  * analyzeRequest - orchestrates rule engine, safe cutoffs, and synchronous Gemini call (demo mode).
//  * Returns an AnalyzeSmsResponse (includes `source` and llmExplanation when used).
//  */
// export async function analyzeRequest(req: AnalyzeSmsRequest): Promise<AnalyzeSmsResponse> {
//   const message = (req.message || '').trim();
//   const sender = req.sender || '';
//   const country = req.country || 'PK';

//   // 1) Run rule-engine (fast, local)
//   const ruleResult = runRules({ message, sender, country });

//   // redacted message (never return or send raw)
//   const redacted = redactPII(message);

//   // 2) SAFE cutoff: do NOT call LLM for clearly benign messages
//   if (ruleResult.confidence < SAFE_CUTOFF) {
//     return {
//       ...ruleResult,
//       redacted,
//       source: 'rules'
//     };
//   }

//   // 3) Instant rules: high-confidence scam -> return immediately
//   if (ruleResult.confidence >= INSTANT_THRESHOLD) {
//     return {
//       ...ruleResult,
//       redacted,
//       source: 'rules'
//     };
//   }

//   // 4) Mid-confidence: call Gemini synchronously (demo mode; protected by timeout/retries inside analyzeWithGemini)
//   try {
//     const ai = await analyzeWithGemini(redacted); // { explanation, verdict, confidence }

//     // conservative combine:
//     // - default: keep ruleResult.isScam
//     // - only flip to scam if LLM verdict is 'scam' AND model confidence >= threshold
//     let finalIsScam = ruleResult.isScam;
//     if (ai.verdict === 'scam' && ai.confidence >= LLM_DECISION_CONFIDENCE) {
//       finalIsScam = true;
//     }

//     const finalConfidence = Number(Math.max(ruleResult.confidence, ai.confidence || 0).toFixed(3));

//     // build reasons: include top LLM line as hint
//     const aiFirstLine = ai.explanation ? ai.explanation.split('\n')[0] : '';
//     const reasons = ruleResult.reasons.slice();
//     if (aiFirstLine) reasons.push(`LLM: ${aiFirstLine}`);

//     const suggestedAction = finalIsScam ? ['report_to_provider'] : ['monitor'];

//     const response: AnalyzeSmsResponse = {
//       isScam: finalIsScam,
//       confidence: finalConfidence,
//       reasons,
//       suggestedAction,
//       triggeredRules: ruleResult.triggeredRules as TriggeredRule[],
//       redacted,
//       llmExplanation: ai.explanation,
//       source: 'llm'
//     };

//     return response;
//   } catch (err) {
//     console.error('analysisService: Gemini call failed', err);
//     // fallback: return safe rule-only result (redacted) and note LLM failure
//     return {
//       ...ruleResult,
//       redacted,
//       llmExplanation: 'LLM unavailable; returned rule-only result',
//       source: 'rules'
//     };
//   }
// }
// 