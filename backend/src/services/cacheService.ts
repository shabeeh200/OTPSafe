// src/services/cacheService.ts
import { redis } from './redisService';
import { AnalyzeSmsResponse } from '../types';

const DEFAULT_TTL = Number(process.env.CACHE_TTL_SEC || 60 * 60 * 24 * 7); // 7 days

export async function getCached(key: string): Promise<AnalyzeSmsResponse | null> {
  try {
    const raw = await (redis as any).get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AnalyzeSmsResponse;
    } catch (e) {
      console.warn('getCached: invalid JSON stored in cache for', key, e);
      return null;
    }
  } catch (e) {
    console.warn('getCached: redis error', e);
    return null;
  }
}

export async function setCached(key: string, payload: AnalyzeSmsResponse, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    // using EX in ioredis param style
    await (redis as any).set(key, JSON.stringify(payload), 'EX', ttl);
  } catch (e) {
    console.warn('setCached: redis error', e);
  }
}
