// api/proxy-analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    // get raw body
    let body;
    if (req.body && Object.keys(req.body).length) {
      body = JSON.stringify(req.body);
    } else {
      body = await new Promise((resolve, reject) => {
        let d = '';
        req.on('data', c => d += c);
        req.on('end', () => resolve(d || '{}'));
        req.on('error', reject);
      });
    }

    console.log('[proxy-js] forwarding to backend, body:', body);

    const backendRes = await fetch('https://otpsafebackend-crp3hkt2.b4a.run/analyze/analyze-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const text = await backendRes.text();
    console.log('[proxy-js] backend status', backendRes.status);

    if (!backendRes.ok) {
      return res.status(502).json({
        error: 'Upstream service error',
        upstreamStatus: backendRes.status,
        upstreamBody: text,
      });
    }

    res.setHeader('Content-Type', backendRes.headers.get('content-type') || 'application/json');
    return res.status(backendRes.status).send(text);
  } catch (err) {
    console.error('[proxy-js] uncaught error', err && (err.stack || err));
    return res.status(500).json({ error: 'Proxy error', message: String(err?.message || err) });
  }
}
