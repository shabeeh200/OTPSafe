import { AnalyzeSmsResponse } from '../types';
export declare function getCached(key: string): Promise<AnalyzeSmsResponse | null>;
export declare function setCached(key: string, payload: AnalyzeSmsResponse, ttl?: number): Promise<void>;
//# sourceMappingURL=cacheService.d.ts.map