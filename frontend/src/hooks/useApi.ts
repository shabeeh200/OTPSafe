// src/hooks/useApi.ts
import { useState, useCallback } from 'react';

type AnalyzeRequest = { message: string; sender?: string; country?: string };
type AnalyzeResponse = any;

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

function safeJson(res: Response) {
  return res.text().then(t => {
    try { return t ? JSON.parse(t) : {}; } catch { return { raw: t }; }
  });
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (body: AnalyzeRequest): Promise<AnalyzeResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/analyze/analyze-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
  
      });
      const data = await safeJson(res);
      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setError(String(msg));
        throw new Error(msg);
      }
      return data;
    } catch (err: any) {
      setError(err?.message || 'Network error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, loading, error };
}
