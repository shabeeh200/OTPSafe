export declare function enqueueJob(listName: string, job: {
    id?: string;
} & unknown): Promise<boolean>;
export declare function removeDedup(jobId: string): Promise<void>;
//# sourceMappingURL=queueService.d.ts.map