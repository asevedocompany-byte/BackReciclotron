import type { FastifyInstance } from "fastify";
import type { SmsCampaignDispatchJob, SmsDispatchResult } from "./sms.types.js";
type SmsDispatchPreviewJob = Pick<SmsCampaignDispatchJob, "campaignId" | "message" | "recipients" | "totalRecipients">;
export declare class SmsDispatchService {
    private readonly app;
    private readonly adapter;
    constructor(app: FastifyInstance);
    send(job: SmsCampaignDispatchJob, signal?: AbortSignal): Promise<SmsDispatchResult>;
    preview(job: SmsDispatchPreviewJob): Promise<{
        campaignId: string;
        message: string;
        recipients: import("./sms.types.js").SmsRecipient[];
        totalRecipients: number;
    }>;
}
export {};
