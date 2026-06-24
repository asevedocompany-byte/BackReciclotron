import type { FastifyInstance } from "fastify";
import type { CreateAudienceSegmentInput, EndUser } from "@reciclotron/contracts";
export declare class AudienceSegmentService {
    private app;
    constructor(app: FastifyInstance);
    list(): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        status?: "active" | "inactive" | undefined;
        city?: string | undefined;
        minimumPoints?: number | undefined;
        maximumPoints?: number | undefined;
    }[]>;
    create(input: CreateAudienceSegmentInput): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        status?: "active" | "inactive" | undefined;
        city?: string | undefined;
        minimumPoints?: number | undefined;
        maximumPoints?: number | undefined;
    }>;
    resolveRecipients(segmentId?: string | null): Promise<EndUser[]>;
}
