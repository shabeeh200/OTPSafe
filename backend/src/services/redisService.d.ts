import Redis from 'ioredis';
export declare const redis: {
    readonly get: (k: string) => unknown;
    readonly set: (k: string, v: string, _mode?: string, _ttl?: number) => unknown;
    readonly rpush: (_list: string, val: string) => unknown;
    readonly blpop: (list: string, _timeout: number) => unknown;
    readonly rpushRaw: (list: string, val: string) => unknown;
} | Redis;
//# sourceMappingURL=redisService.d.ts.map