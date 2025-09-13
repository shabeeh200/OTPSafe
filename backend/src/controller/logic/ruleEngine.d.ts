export interface RuleMatchResult {
    reason: string;
}
export interface Rule {
    name: string;
    weight: number;
    match: (msg: string, meta?: AnalysisMeta, additionalTemplates?: string[]) => RuleMatchResult | null;
}
export interface AnalysisMeta {
    sender?: string;
    country?: string;
    brandList?: string[];
}
export interface AnalysisResult {
    isScam: boolean;
    confidence: number;
    reasons: string[];
    suggestedAction: string[];
    triggeredRules: {
        name: string;
        weight: number;
        reason: string;
    }[];
    redacted: string;
}
/** Default rule definitions with starting weights (0..1). */
declare const RULES: Rule[];
/** Redact PII (use before sending to any external LLM) */
declare function redactPII(message: string): string;
interface AnalyzeSmsParams {
    message?: string;
    sender?: string;
    country?: string;
    additionalTemplates?: string[];
}
/** Main analyze function */
declare function analyzeSms({ message, sender, country, additionalTemplates }: AnalyzeSmsParams): AnalysisResult;
/** Export */
export { analyzeSms, redactPII, RULES };
//# sourceMappingURL=ruleEngine.d.ts.map