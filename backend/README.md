# OTPSafe

## Overview
OTPSafe is a modern, TypeScript-powered backend service designed to analyze SMS messages for potential scams and phishing attempts. It leverages rule-based logic and AI (Gemini integration planned) to provide robust, real-time analysis and actionable insights.

## Features
- **Express.js & TypeScript:** Clean, scalable, and type-safe backend architecture.
- **Rule Engine:** Customizable logic for detecting scam patterns in SMS.
- **PII Redaction:** Ensures privacy before AI processing.
- **AI Integration (Planned):** Gemini API for advanced scam detection.
- **RESTful API:** Simple endpoints for integration with any frontend.
- **Extensible Design:** Easily add new rules, services, or AI models.

## Project Structure
```
backend/
  src/
    controller/      # Route handlers
    rules/           # Rule engine logic
    service/         # Business logic & integrations
    types.ts         # Shared types/interfaces
    index.ts         # App entry point
  package.json
  tsconfig.json
  .env
```

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
   cd OTPSafe/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```
   PORT=3000
   NODE_ENV=development
   ```
4. Run the server:
   ```bash
   npx ts-node-dev src/index.ts
   ```

## Why OTPSafe?

- **Security Focus:** Tackles real-world problems in digital communication.
- **Scalable Architecture:** Ready for production and further development.
- **Demonstrates Best Practices:** TypeScript, modularity, error handling, and extensibility.
- **AI Ready:** Designed for easy integration with modern AI APIs.

## Next Steps

- Add a React frontend for user interaction.
- Integrate Gemini or other AI models.
- Expand rule engine for more countries/languages.
- Add automated tests and CI/CD.

## License

MIT

---

**Showcase this project to highlight your skills in backend development, security, and modern TypeScript engineering!**
