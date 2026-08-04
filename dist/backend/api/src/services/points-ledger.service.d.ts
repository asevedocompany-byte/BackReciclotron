import type { FastifyInstance } from "fastify";
import type { CreateLedgerEntryInput } from "@reciclotron/contracts";
export declare class PointsLedgerService {
    private app;
    private repository;
    constructor(app: FastifyInstance);
    list(filters?: {
        userId?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    listLatestByUser(): Promise<any[]>;
    create(input: CreateLedgerEntryInput): Promise<{
        id: string;
        createdAt: string;
        updatedAt: string;
        type: "credit" | "debit";
        description: string;
        userId: string;
        points: number;
        source: string;
    }>;
}
