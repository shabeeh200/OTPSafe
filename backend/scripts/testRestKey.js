// scripts/testRestKey.js
// CommonJS-friendly test using global fetch (Node >= 18)
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!KEY) {
  console.error('GEMINI_API_KEY not set');
  process.exit(2);
}

(async () => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': KEY
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: 'Hello from Node REST test' }] }
        ]
      })
    });

    console.log('status', res.status);
    const txt = await res.text();
    try {
      console.log(JSON.stringify(JSON.parse(txt), null, 2));
    } catch {
      console.log(txt);
    }
  } catch (err) {
    console.error('fetch failed:', err);
  }
})();
