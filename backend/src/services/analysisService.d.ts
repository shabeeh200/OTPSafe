import { AnalyzeSmsRequest, AnalyzeSmsResponse } from '../types';
/**
 * Safer escalation policy:
 * - If rule confidence >= INSTANT_THRESHOLD => return rules (flag)
 * - If rule confidence < LOW_THRESHOLD => return rules (safe)
 * - Only when LOW_THRESHOLD <= confidence < INSTANT_THRESHOLD AND
 *   at least one rule triggered => enqueue to LLM
 */
export declare function analyzeRequest(req: AnalyzeSmsRequest): Promise<AnalyzeSmsResponse>;
//# sourceMappingURL=analysisService.d.ts.map