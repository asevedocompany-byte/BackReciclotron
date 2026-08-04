export type CampaignDispatchStatus = "queued" | "running" | "completed" | "failed";
export type CampaignDispatchState = {
    campaignId: string;
    status: CampaignDispatchStatus;
    progress: number;
    totalRecipients: number;
    processedRecipients: number;
    acceptedRecipients: number;
    rejectedRecipients: number;
    queuedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    errorReason: string | null;
};
export type CampaignDispatchJob = {
    campaignId: string;
    recipientIds: (string | number)[];
    totalRecipients: number;
};
export type CampaignDispatchContext = {
    signal: AbortSignal;
    timeoutMs: number;
    runId: string;
};
type CampaignDispatchProcessor = (job: CampaignDispatchJob, context: CampaignDispatchContext) => Promise<void>;
type CampaignDispatchListener = (state: CampaignDispatchState) => void;
export declare class CampaignEmailQueueService {
    private readonly jobs;
    private readonly states;
    private readonly listeners;
    private readonly active;
    private readonly cleanupTimers;
    private readonly maxConcurrentCampaigns;
    private readonly jobTimeoutMs;
    private readonly terminalStateRetentionMs;
    private processor?;
    private draining;
    setProcessor(processor: CampaignDispatchProcessor): void;
    dispose(): void;
    subscribe(campaignId: string, listener: CampaignDispatchListener): () => void;
    enqueue(job: CampaignDispatchJob): CampaignDispatchState;
    getStatus(campaignId: string): CampaignDispatchState | null;
    updateStatus(campaignId: string, patch: Partial<CampaignDispatchState>): {
        campaignId: string;
        status: CampaignDispatchStatus;
        progress: number;
        totalRecipients: number;
        processedRecipients: number;
        acceptedRecipients: number;
        rejectedRecipients: number;
        queuedAt: string;
        startedAt: string | null;
        completedAt: string | null;
        errorReason: string | null;
    } | null;
    private emit;
    private drain;
    private run;
}
export {};
