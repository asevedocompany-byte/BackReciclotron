import type { FastifyInstance } from "fastify";
export declare class EndUserService {
    private app;
    private repository;
    private pointsLedgerRepository;
    private static listCache;
    private static readonly listCacheTtlMs;
    constructor(app: FastifyInstance);
    static invalidateListCache(): void;
    private loadList;
    list(): Promise<{
        pointsBalance: number;
        status: "active" | "inactive";
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        phone: string | null;
    }[]>;
    findById(id: string): Promise<{
        status: "active" | "inactive";
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        pointsBalance: number;
        phone: string | null;
    } | null>;
}
