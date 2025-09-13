"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWithGemini = analyzeWithGemini;
// src/services/geminiService.ts
const generative_ai_1 = require("@google/generative-ai");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 8000);
const LLM_RETRIES = Number(process.env.LLM_RETRIES || 2);
if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set. Gemini calls will fallback to a safe mock.");
}
/** small retry helper */
async function withRetries(fn, retries = LLM_RETRIES) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        }
        catch (err) {
            attempt++;
            if (attempt > retries)
                throw err;
            const backoff = 200 * 2 ** attempt;
            await new Promise((r) => setTimeout(r, backoff));
        }
    }
}
/**
 * Extract best text from SDK response object.
 * This is defensive: SDK shapes sometimes change; we try common places.
 */
function extractTextFromSdkResult(result) {
    // prefer .response?.text() if present
    try {
        if (typeof result?.response?.text === "function") {
            const s = result.response.text();
            if (s)
                return String(s);
        }
    }
    catch { }
    // fallbacks: check common fields
    if (typeof result?.output === "string")
        return result.output;
    if (Array.isArray(result?.candidates) && result.candidates[0]?.content) {
        // try flattening content
        const cont = result.candidates[0].content;
        if (Array.isArray(cont))
            return cont.map((c) => c?.text ?? "").join("\n");
        if (typeof cont === "string")
            return cont;
    }
    // last resort: JSON dump
    return JSON.stringify(result);
}
/**
 * Analyze a redacted message with Gemini (returns explanation, verdict, confidence)
 */
async function analyzeWithGemini(redactedMessage) {
    if (!GEMINI_API_KEY) {
        // fallback mock
        return {
            explanation: "Gemini disabled: no API key. Fallback mock says possible scam due to urgency/brand mention.",
            verdict: "scam",
            confidence: 0.75,
        };
    }
    // create SDK client once per call (cheap)
    const client = new generative_ai_1.GoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
    return withRetries(async () => {
        // Promise.race to implement timeout (SDK may not support AbortController)
        const sdkPromise = (async () => {
            // use SDK high-level API
            // NOTE: different SDK versions may use slightly different method names; this matches the common pattern:
            const model = client.getGenerativeModel({ model: GEMINI_MODEL });
            const prompt = `You are a concise SMS fraud analyst. Explain why the message may or may not be a scam. Provide a one-line verdict: "scam" or "not_scam", and a numeric confidence between 0 and 1. Keep the explanation short.

Message:
"""${redactedMessage}"""`;
            // generate content via SDK
            const result = await model.generateContent(prompt);
            return result;
        })();
        const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error("LLM timeout")), LLM_TIMEOUT_MS));
        const result = await Promise.race([sdkPromise, timeoutPromise]);
        const text = extractTextFromSdkResult(result).trim();
        // heuristics to parse verdict and confidence from text
        const lower = text.toLowerCase();
        let verdict = "unknown";
        if (lower.includes("scam") && !lower.includes("not a scam"))
            verdict = "scam";
        if (lower.includes("not scam") || lower.includes("not a scam") || lower.includes("not_scam"))
            verdict = "not_scam";
        // attempt to find a 0..1 confidence number in the explanatory text
        const confMatch = text.match(/(?<!\d)(0(?:\.\d+)?|1(?:\.0+)?)(?!\d)/);
        const confidence = confMatch ? Math.max(0, Math.min(1, Number(confMatch[0]))) : 0.75;
        return { explanation: text, verdict, confidence };
    }, LLM_RETRIES);
}
//# sourceMappingURL=geminiService.js.map