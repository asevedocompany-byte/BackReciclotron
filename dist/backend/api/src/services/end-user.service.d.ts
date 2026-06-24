import type { FastifyInstance } from "fastify";
export declare class EndUserService {
    private app;
    private repository;
    private pointsLedgerRepository;
    constructor(app: FastifyInstance);
    list(): Promise<{
        status: "active" | "inactive";
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        pointsBalance: number;
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
