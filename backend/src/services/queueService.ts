// src/services/queueService.ts
import { redis } from './redisService';

const DEDUP_SET = 'scam:dedup';

export async function enqueueJob(listName: string, job: { id?: string } & unknown): Promise<boolean> {
  try {
    // job.id must exist and be the dedupe key (analysisService sets it)
    const jobId = (job as any).id;
    if (!jobId) {
      console.warn('enqueueJob: job missing id, refusing to enqueue to avoid duplicates');
      return false;
    }

    // Try to add to dedupe set. SADD returns number of elements added (0 if already present)
    const added = await (redis as any).sadd(DEDUP_SET, jobId);
    if (!added) {
      // Already enqueued/processing recently
      return false;
    }

    // safe push to queue
    await (redis as any).rpush(listName, JSON.stringify(job));
    return true;
  } catch (e) {
    console.error('enqueueJob failed', e);
    return false;
  }
}

export async function removeDedup(jobId: string): Promise<void> {
  try {
    await (redis as any).srem(DEDUP_SET, jobId);
  } catch (e) {
    console.warn('removeDedup failed', e);
  }
}
