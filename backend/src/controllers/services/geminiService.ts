import dotenv from 'dotenv';
dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 8000);
const LLM_RETRIES = Number(process.env.LLM_RETRIES || 1);

// Circuit-breaker settings
const GEMINI_DISABLE_MINUTES = Number(process.env.GEMINI_DISABLE_MINUTES || 5); // short for demo

// Rate limiter settings (per-process) - very simple token-bucket per minute - KEEP IN FOCUS ON PROD LEVEL
const LLM_RATE_PER_MIN = Number(process.env.LLM_RATE_PER_MIN || 20); // change lower to save quota

/* ----------------- in-memory circuit-breaker ----------------- */
let disabledUntil = 0;
export function disableGeminiForMinutes(minutes = GEMINI_DISABLE_MINUTES) {
  disabledUntil = Date.now() + minutes * 60_000;
}
export function forceEnableGemini() {
  disabledUntil = 0;
}
export function getGeminiDisabledUntil() {
  return disabledUntil;
}
export function isGeminiDisabled() {
  return Date.now() < disabledUntil;
}

/* ----------------- simple token-bucket per-minute rate limiter ----------------- */ // not super precise but good for demo _KEEP IN FOCUS ON PROD LEVEL
let tokens = LLM_RATE_PER_MIN;
let lastRefillMin = Math.floor(Date.now() / 60_000);

function refillTokensIfNeeded() {
  const nowMin = Math.floor(Date.now() / 60_000);
  if (nowMin !== lastRefillMin) {
    tokens = LLM_RATE_PER_MIN;
    lastRefillMin = nowMin;
  }
}

function consumeToken(): boolean {
  refillTokensIfNeeded();
  if (tokens > 0) {
    tokens--;
    return true;
  }
  return false;
}

/* ----------------- helpers ----------------- */
function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
function extractJsonFromText(text: string): any | null {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();

  // 1) direct parse
  try { return JSON.parse(t); } catch {}

  const codeFenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fenceMatch = t.match(codeFenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // 3) find first balanced { ... } block
  const firstBrace = t.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    for (let i = firstBrace; i < t.length; i++) {
      const ch = t[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) {
        const candidate = t.slice(firstBrace, i + 1);
        try { return JSON.parse(candidate); } catch { break; }
      }
    }
  }
  return null;
}

async function restGenerate(redactedMessage: string): Promise<{ explanation: string; verdict: 'scam'|'not_scam'|'unknown'; confidence: number }> {
  if (!GEMINI_API_KEY) {
    return { explanation: 'Gemini API key not set (mock)', verdict: 'unknown', confidence: 0 };
  }

  if (!consumeToken()) {
    const err: any = new Error('LLM rate limit exceeded (local)');
    err.status = 429;
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;


const prompt = `You are a strict SMS fraud classifier. Return EXACTLY one JSON object and nothing else, with these keys:
{"verdict":"scam"|"not_scam"|"unknown","confidence":0.0,"explanation":"brief 1-2 sentence explanation"}
DO NOT wrap the JSON in markdown code fences (no backticks), do not add any extra text before or after the JSON.
Message:
"""${redactedMessage}"""`;


const body = { contents: [{ parts: [{ text: prompt }] }] };

for (let attempt = 0; attempt <= LLM_RETRIES; attempt++) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);

    const raw = await resp.text();
    if (!resp.ok) {
      const err: any = new Error(`Gemini REST error ${resp.status}: ${raw}`);
      err.status = resp.status;
      err.body = raw;
      const rawLower = String(raw || '').toLowerCase();
      if (resp.status === 400 && rawLower.includes('api key')) {
        disableGeminiForMinutes(GEMINI_DISABLE_MINUTES);
      }
      throw err;
    }

    let parsedJson: any = null;
    try {
      const parsedResp = JSON.parse(raw);
      const text = parsedResp?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text).join('\n') ?? raw;
      parsedJson = extractJsonFromText(text);
    } catch (e) {
      // top-level parse failed, try extracting directly from raw
      parsedJson = extractJsonFromText(raw);
    }


    // If parsedJson valid, validate fields
    if (parsedJson && typeof parsedJson === 'object') {
      const verdict = (parsedJson.verdict || '').toString();
      const confidence = Number(parsedJson.confidence ?? 0);
      const explanation = String(parsedJson.explanation ?? '').trim();

      if (['scam','not_scam','unknown'].includes(verdict) && !Number.isNaN(confidence)) {
        return {
          explanation: explanation || raw,
          verdict: verdict as 'scam'|'not_scam'|'unknown',
          confidence: Math.max(0, Math.min(1, confidence))
        };
      }
    }

    // fallback.....
    return { explanation: raw.trim(), verdict: 'unknown', confidence: 0 };

  } catch (err: any) {
    clearTimeout(timer);
    if (attempt < LLM_RETRIES) {
      const backoff = 200 * 2 ** attempt + Math.floor(Math.random()*100);
      await sleep(backoff);
      continue;
    }
    throw err;
  }
}

  throw new Error('unreachable');
}

/* ----------------- public API ----------------- */
export async function analyzeWithGemini(redactedMessage: string): Promise<{ explanation: string; verdict: 'scam'|'not_scam'|'unknown'; confidence: number }> {
  // short-circuit if disabled
  if (isGeminiDisabled()) {
    return { explanation: 'Gemini temporarily disabled', verdict: 'unknown', confidence: 0 };
  }

  try {
    return await restGenerate(redactedMessage);
  } catch (err: any) {
    // if the error indicates API key invalid (string search), disable for a while
    const msg = String(err?.message || '').toLowerCase();
    const body = String(err?.body || '').toLowerCase();
    if (msg.includes('api key') || body.includes('api key') || (err?.status === 400 && body.includes('api key'))) {
      disableGeminiForMinutes(GEMINI_DISABLE_MINUTES);
      console.error('Gemini disabled due to API key error:', err.message || err);
      return { explanation: 'Gemini temporarily disabled due to API key error', verdict: 'unknown', confidence: 0 };
    }
    // other errors: return safe fallback to keep service up (do not crash)
    console.error('Gemini REST call failed:', err?.message || err);
    return { explanation: 'LLM unavailable; returning fallback', verdict: 'unknown', confidence: 0 };
  }
}
