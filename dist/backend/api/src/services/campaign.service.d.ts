import type { FastifyInstance } from "fastify";
import type { CreateCampaignInput } from "@reciclotron/contracts";
export declare class CampaignService {
    private readonly app;
    private readonly audienceSegmentService;
    private emailDispatchService?;
    constructor(app: FastifyInstance);
    list(): Promise<{
        message: string;
        status: "draft" | "scheduled" | "sent";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
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
        segmentId: string | null;
        estimatedCost: number;
        providerMessageId: string | null;
        sentAt: string | null;
        subject?: string | undefined;
    }>;
    private resolveRecipients;
    send(campaignId: string, recipientIds?: (string | number)[]): Promise<{
        message: string;
        status: "draft" | "scheduled" | "sent";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        estimatedCost: number;
        providerMessageId: string | null;
        sentAt: string | null;
        subject?: string | undefined;
    }>;
    getRecipients(campaignId: string): Promise<{
        status: "sent" | "failed";
        email: string;
        id: string;
        sentAt: string;
        campaignId: string;
        legacyId: number;
        messageId: string | null;
        errorReason: string | null;
    }[]>;
}
