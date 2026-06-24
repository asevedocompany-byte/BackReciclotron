import type { FastifyInstance } from "fastify";
export declare class MetricsService {
    private app;
    constructor(app: FastifyInstance);
    getDashboard(): Promise<{
        users: {
            total: number;
            active: number;
        };
        points: {
            transactions: number;
            totalBalance: number;
        };
        campaigns: {
            total: number;
            sent: number;
            emailSent: number;
            smsSent: number;
        };
        partnerStores: {
            total: number;
            active: number;
        };
        collectionPoints: {
            total: number;
            active: number;
        };
        automationRules: number;
        legacyDb: {
            readonly status: "not_configured";
            readonly details: "Aguardando acesso ao banco legado do cliente.";
        };
    }>;
}
