// src/worker/worker.ts
import { redis } from '../services/redisService';
import { analyzeWithGemini } from '../services/geminiService';
import { setCached } from '../services/cacheService';
import { Client as PgClient } from 'pg';
import { AnalyzeSmsResponse } from '../types';
import { removeDedup } from '../services/queueService';


const DATABASE_URL = process.env.DATABASE_URL;
const pg = DATABASE_URL ? new PgClient({ connectionString: DATABASE_URL }) : null;

async function saveToDb(id: string, sender: string, message: string, verdict: string, confidence: number, explanation: string) {
  if (!pg) {
    // db not configured — skip
    return;
  }
  try {
    await pg.query(
      `INSERT INTO verdicts(id, sender, message, verdict, confidence, explanation, created_at, updated_at)
       VALUES($1,$2,$3,$4,$5,$6,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET verdict = EXCLUDED.verdict, confidence = EXCLUDED.confidence, explanation = EXCLUDED.explanation, updated_at = NOW()`,
      [id, sender, message, verdict, confidence, explanation]
    );
  } catch (e) {
    console.error('saveToDb failed', e);
  }
}

async function processRaw(raw: string) {
  let job;
  try {
    job = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid job payload', raw, e);
    // push raw to failed queue for manual inspection
    try { await (redis as any).rpush('scam:failed', raw); } catch (_) {}
    return;
  }

  const { id, sender = '', message } = job;
// inside processRaw (after ai analysis and before finishing)
try {
  const ai = await analyzeWithGemini(message); // message is already redacted from job
  const response: AnalyzeSmsResponse = {
    isScam: ai.verdict === 'scam',
    confidence: ai.confidence,
    reasons: [ai.explanation],
    suggestedAction: ai.verdict === 'scam' ? ['report_to_provider'] : ['monitor'],
    triggeredRules: [],
    redacted: message,
    llmExplanation: ai.explanation,
    source: 'llm'
  };

  // cache result
  await setCached(id, response);

  // persist (use redacted message explicitly)
  await saveToDb(id, sender, message, ai.verdict, ai.confidence, ai.explanation);

  // remove dedupe so identical messages can be reprocessed later if needed
  try { await removeDedup(id); } catch (e) { console.warn('removeDedup warning', e); }

} catch (e) {
  console.error('processRaw error', e);
  try { await (redis as any).rpush('scam:failed', raw); } catch (ie) { console.error('failed to push failed job', ie); }
}

}

async function main() {
  if (pg) {
    try { await pg.connect(); console.log('Worker connected to Postgres'); }
    catch (e) { console.warn('Worker DB connect failed, continuing without DB', e); }
  } else {
    console.log('DATABASE_URL not provided; worker will not persist to DB.');
  }

  console.log('Worker starting; listening for jobs on scam:queue');
  while (true) {
    try {
      // blocking pop. Works with real Redis; our in-memory fallback has a naive blpop impl for local dev.
      const res = await (redis as any).blpop('scam:queue', 0);
      const raw = Array.isArray(res) ? res[1] : res;
      if (raw) await processRaw(raw);
    } catch (e) {
      console.error('Worker loop error', e);
      // backoff on error
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main().catch(err => {
  console.error('Worker crashed', err);
  process.exit(1);
});
