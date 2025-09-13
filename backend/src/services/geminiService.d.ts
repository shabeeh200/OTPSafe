/**
 * Analyze a redacted message with Gemini (returns explanation, verdict, confidence)
 */
export declare function analyzeWithGemini(redactedMessage: string): Promise<{
    explanation: string;
    verdict: "scam" | "not_scam" | "unknown";
    confidence: number;
}>;
//# sourceMappingURL=geminiService.d.ts.map