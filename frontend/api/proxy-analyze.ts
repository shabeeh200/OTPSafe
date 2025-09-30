// api/proxy-analyze.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const body =
      req.body && Object.keys(req.body).length ? JSON.stringify(req.body) :
      await new Promise<string>((resolve, reject) => {
        let d = '';
        req.on('data', c => d += c);
        req.on('end', () => resolve(d || '{}'));
        req.on('error', reject);
      });

    const backendRes = await fetch('https://otpsafebackend-crp3hkt2.b4a.run/analyze/analyze-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const text = await backendRes.text();
    res.setHeader('Content-Type', backendRes.headers.get('content-type') || 'application/json');
    return res.status(backendRes.status).send(text);
  } catch (err) {
    console.error('proxy error', err);
    return res.status(502).json({ error: 'Bad gateway' });
  }
}
