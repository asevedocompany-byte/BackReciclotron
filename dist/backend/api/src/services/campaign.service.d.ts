import type { FastifyInstance } from "fastify";
import type { CreateCampaignInput } from "@reciclotron/contracts";
import type { SmsQueueState } from "./sms/sms.types.js";
type CampaignDispatchState = {
    campaignId: string;
    status: "queued" | "running" | "completed" | "failed";
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
export declare class CampaignService {
    private readonly app;
    private readonly audienceSegmentService;
    private readonly sesAdapter;
    private emailDispatchService?;
    constructor(app: FastifyInstance);
    private persistSmsPendingRecipients;
    private buildSmsMockRecipients;
    private recoverInterruptedSmsDispatch;
    list(): Promise<{
        message: string;
        status: "draft" | "scheduled" | "sent";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        attachments: string[];
        segmentId: string | null;
        estimatedCost: number;
        providerMessageId: string | null;
        sentAt: string | null;
        subject?: string | undefined;
    }[]>;
    create(input: CreateCampaignInput): Promise<{
        message: string;
        status: "draft" | "scheduled" | "sent";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        attachments: string[];
        segmentId: string | null;
        estimatedCost: number;
        providerMessageId: string | null;
        sentAt: string | null;
        subject?: string | undefined;
    }>;
    private resolveRecipients;
    private resolveSmsRecipients;
    private throwIfAborted;
    send(campaignId: string, recipientIds?: (string | number)[]): Promise<({
        message: string;
        status: "draft" | "scheduled" | "sent";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        attachments: string[];
        segmentId: string | null;
        estimatedCost: number;
        providerMessageId: string | null;
        sentAt: string | null;
        subject?: string | undefined;
    } & {
        dispatchJobId: string;
        dispatchState: CampaignDispatchState;
    }) | ({
        message: string;
        status: "draft" | "scheduled" | "sent";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        attachments: string[];
        segmentId: string | null;
        estimatedCost: number;
        providerMessageId: string | null;
        sentAt: string | null;
        subject?: string | undefined;
    } & {
        queuedAt: string;
        dispatchStatus: string;
        dispatchProgress: number;
        dispatchTotalRecipients: number;
    })>;
    executeSend(campaignId: string, recipientIds?: (string | number)[], totalRecipientsHint?: number, signal?: AbortSignal): Promise<{
        message: string;
        status: "draft" | "scheduled" | "sent";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        attachments: string[];
        segmentId: string | null;
        estimatedCost: number;
        providerMessageId: string | null;
        sentAt: string | null;
        subject?: string | undefined;
    }>;
    getRecipients(campaignId: string): Promise<{
        status: "sent" | "failed" | "pending";
        email: string;
        id: string;
        phone: string | null;
        sentAt: string;
        campaignId: string;
        legacyId: number;
        recipientName: string | null;
        messageId: string | null;
        errorReason: string | null;
    }[]>;
    getDispatchStatus(campaignId: string): Promise<import("./email/email-campaign-queue.service.js").CampaignDispatchState | SmsQueueState | {
        campaignId: string;
        status: string;
        progress: number;
        totalRecipients: number;
        processedRecipients: number;
        acceptedRecipients: number;
        rejectedRecipients: number;
        queuedAt: string;
        startedAt: string;
        completedAt: string | null;
        errorReason: string | null;
    } | {
        campaignId: string;
        status: string;
        progress: number;
        totalRecipients: number;
        processedRecipients: number;
        acceptedRecipients: number;
        rejectedRecipients: number;
        queuedAt: string;
        startedAt: null;
        completedAt: string | null;
        errorReason: null;
    } | null>;
    getQuotaAndBilling(): Promise<{
        quota: {
            sentLast24h: number;
            max24hSend: number;
            remaining24h: number;
            maxSendRatePerSec: number;
            isMock: boolean;
        };
        cost: {
            customer: {
                emailCost: number;
                attachmentCost: number;
                totalAttachmentGB: number;
                smsCost: number;
                totalCost: number;
            };
            aws: {
                emailOutboundCostUsd: number;
                attachmentCostUsd: number;
                totalCostUsd: number;
                totalCostBrl: number;
                exchangeRate: number;
            };
        };
    }>;
}
export {};
