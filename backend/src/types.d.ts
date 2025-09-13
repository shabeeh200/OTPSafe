export interface AnalyzeSmsRequest {
    message: string;
    sender?: string;
    country?: string;
}
export interface AnalyzeSmsResponse {
    isScam: boolean;
    confidence: number;
    reasons: string[];
    suggestedAction: string[];
    triggeredRules: TriggeredRule[];
    redacted: string;
    llmExplanation?: string;
    source: 'rules' | 'llm' | 'cache' | 'llm_pending';
}
export interface TriggeredRule {
    name: string;
    weight: number;
    reason: string;
}
export interface ApiErrorResponse {
    error: string;
    details?: string;
}
export declare function isAnalyzeSmsRequest(body: any): body is AnalyzeSmsRequest;
//# sourceMappingURL=types.d.ts.map