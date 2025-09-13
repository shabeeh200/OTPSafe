// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 8000);
const LLM_RETRIES = Number(process.env.LLM_RETRIES || 2);

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set. Gemini calls will fallback to a safe mock.");
}

async function withRetries<T>(fn: () => Promise<T>, retries = LLM_RETRIES): Promise<T> {
  let attempt = 0;
  while (true) {
    try { return await fn(); }
    catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      const backoff = 200 * 2 ** attempt;
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}

function extractTextFromSdkResult(result: any): string {
  try {
    if (typeof result?.response?.text === "function") {
      const s = result.response.text();
      if (s) return String(s);
    }
  } catch {}
  if (typeof result?.output === "string") return result.output;
  if (Array.isArray(result?.candidates) && result.candidates[0]?.content) {
    const cont = result.candidates[0].content;
    if (Array.isArray(cont)) return cont.map((c:any)=>c?.text ?? "").join("\n");
    if (typeof cont === "string") return cont;
  }
  return JSON.stringify(result);
}

export async function analyzeWithGemini(redactedMessage: string): Promise<{ explanation: string; verdict: 'scam'|'not_scam'|'unknown'; confidence: number }> {
  if (!GEMINI_API_KEY) {
    return { explanation: 'Gemini disabled: mock', verdict: 'unknown', confidence: 0 };
  }

  const client = new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY } as any);

  return withRetries(async () => {
    const sdkPromise = (async () => {
      const model = client.getGenerativeModel({ model: GEMINI_MODEL });
      const prompt = `You are a concise SMS fraud analyst. Decide if the message is a scam or not. Output a short explanation, then a one-word verdict "scam" or "not_scam", and a confidence number 0..1.
Message:
"""${redactedMessage}"""`;
      const result = await model.generateContent(prompt);
      return result;
    })();

    const timeoutPromise = new Promise<never>((_, rej) => setTimeout(()=>rej(new Error('LLM timeout')), LLM_TIMEOUT_MS));
    const result = await Promise.race([sdkPromise, timeoutPromise]) as any;
    const text = extractTextFromSdkResult(result).trim();
    const lower = text.toLowerCase();

    let verdict: 'scam'|'not_scam'|'unknown' = 'unknown';
    if (lower.includes('scam') && !lower.includes('not a scam')) verdict = 'scam';
    if (lower.includes('not scam') || lower.includes('not a scam') || lower.includes('not_scam')) verdict = 'not_scam';

    const confMatch = text.match(/(?<!\d)(0(?:\.\d+)?|1(?:\.0+)?)(?!\d)/);
    const confidence = confMatch ? Math.max(0, Math.min(1, Number(confMatch[0]))) : 0.75;

    return { explanation: text, verdict, confidence };
  }, LLM_RETRIES);
}
