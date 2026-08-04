import type { SmsCampaignDispatchContext, SmsCampaignDispatchJob, SmsCampaignJobPayload, SmsQueueState, SmsQueueStatus } from "./sms.types.js";
type SmsCampaignDispatchProcessor = (job: SmsCampaignDispatchJob, context: SmsCampaignDispatchContext) => Promise<void>;
type SmsCampaignDispatchListener = (state: SmsQueueState) => void;
export declare class SmsCampaignQueueService {
    private readonly jobs;
    private readonly campaignIndex;
    private readonly listeners;
    private readonly active;
    private readonly maxConcurrentCampaigns;
    private readonly terminalStateRetentionMs;
    private readonly cleanupTimer;
    private processor?;
    private draining;
    constructor();
    setProcessor(processor: SmsCampaignDispatchProcessor): void;
    dispose(): void;
    enqueue(job: SmsCampaignJobPayload): SmsQueueState;
    getStatus(id: string): SmsQueueState | null;
    getStatusByCampaignId(campaignId: string): SmsQueueState | null;
    subscribe(id: string, listener: SmsCampaignDispatchListener): () => void;
    publishProgress(jobId: string, patch: Partial<SmsQueueState>, options?: {
        force?: boolean;
        emitIfPercentAdvancedBy?: number;
    }): SmsQueueState | null;
    complete(jobId: string): SmsQueueState | null;
    fail(jobId: string, errorReason: string, status?: SmsQueueStatus): SmsQueueState | null;
    private emit;
    private resolveJobId;
    private drain;
    private run;
    private cleanupExpiredJobs;
}
export {};
