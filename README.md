# OTPSafe

OTPSafe is a  TypeScript-powered backend service/project designed to analyze SMS messages for potential scams and phishing attempts.I kept coming across scam SMS reports on LinkedIn and other platforms, but couldn’t find an easy tool to analyze them. That gap inspired me to try building one.I built this backend to experiment with practical rule-based detection and AI assistance (Gemini integrated) for real-time scam detection.It’s more of a learning + problem-solving project than a polished production system.

## TL;DR
- Backend: TypeScript + Express API that checks SMS for scams.  
- Rules first — AI fallback when confidence is uncertain.  
- Frontend exists and talks to this backend.  
- Note: Back4App / CloudFront edge caused CORS/preflight problems; I opened a support ticket. I tried a serverless proxy as a workaround but the CDN edge still blocked some requests.

## Key features
- Fast rule engine for pattern detection  
- PII redaction before any external calls  
- AI integration (Gemini) — used when rule confidence is below/above a configurable threshold  
- Clean TypeScript code and simple REST endpoints  
- Easy to extend with new rules, languages, or models

## How it works (very short)
1. Receive SMS payload.  
2. Run rule checks → if rules give a clear result, return it.  
3. If confidence is uncertain, redact PII and call the AI (Gemini).  
4. Return verdict, confidence, and short explanation.

> **Note:** AI is not the default — it’s used only when rules can’t decide confidently.

## API Endpoints

- `POST /api/analyze-sms`  
  Analyze an SMS message for scam/phishing risk.

- `GET /health`  
  Health check endpoint.

## How It Works

1. **Input Validation:** Ensures requests are well-formed.
2. **Rule Analysis:** Applies domain-specific rules to detect scams.
3. **Confidence Threshold:** If uncertain, escalates to AI (Gemini).
4. **PII Redaction:** Protects user privacy before external calls.
5. **Clear Responses:** Returns actionable insights and explanations.

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/OTPSafe.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
## Environment variables

| Variable                   | Description                                                                 | Example |
|-----------------------------|-----------------------------------------------------------------------------|---------|
| `PORT`                     | Port to run the backend on                                                  | `3000` |
| `NODE_ENV`                 | Runtime mode (`development` or `production`)                                | `production` |
| `CORS_ORIGIN`              | Allowed frontend origin(s), comma-separated                                 | `http://localhost:4173/` |
| `ADMIN_TOKEN`              | Secret token for admin routes                                               | `replace_with_a_strong_secret` |

### AI / Gemini config
| Variable                   | Description                                                                 | Example |
|-----------------------------|-----------------------------------------------------------------------------|---------|
| `GEMINI_MODEL`             | Gemini model name                                                           | `gemini-2.0-flash` |
| `LLM_TIMEOUT_MS`           | Max request time for AI in ms                                               | `8000` |
| `LLM_RETRIES`              | How many times to retry failed AI calls                                     | `2` |
| `GEMINI_DISABLE_MINUTES`   | Cooldown minutes if Gemini keeps failing                                    | `5` |
| `LLM_RATE_PER_MIN`         | Max requests per minute                                                     | `20` |
| `LLM_DECISION_CONFIDENCE`  | Min AI confidence required for a decision                                   | `0.75` |

### Rule engine thresholds
| Variable                   | Description                                                                 | Example |
|-----------------------------|-----------------------------------------------------------------------------|---------|
| `RULES_SAFE_CUTOFF`        | If below this, classify as **safe** directly                                | `0.2` |
| `RULES_INSTANT_THRESHOLD`  | If above this, classify as **scam** directly                                | `0.8` |
| `MIN_SUM_WEIGHTS_FOR_LLM`  | Rule weight sum required before asking AI                                   | `0.8` |
| `MIN_MAX_WEIGHT_FOR_LLM`   | Strongest single rule weight required before asking AI                      | `0.7` |
| `MIN_MESSAGE_LENGTH_FOR_LLM` | Minimum message length to send to AI                                       | `20` |

---
   ```
4. Run the server:
   ```bash
   npx ts-node-dev src/index.ts
5. Run the frontend:
   ```bash
   npm run build
   npm run preview
   ```

## Why this project

I made this because I saw a real-world problem and wanted to build a practical tool that uses both rule-based logic and AI (Gemini) for real-time scam detection. It’s an experiment, useful and extendable — not a finished product.


## Next Steps

- Add automated tests and CI/CD.

## License

MIT

---

