import type { FastifyInstance } from "fastify";
import type { Campaign } from "@reciclotron/contracts";
export type RecipientInput = {
    legacyId: number;
    email: string;
};
type EmailDispatchResult = {
    providerMessageId: string;
    accepted: number;
    rejected: number;
};
export declare class EmailDispatchService {
    private readonly app;
    private readonly sesAdapter;
    private readonly maxAttempts;
    private readonly baseRetryDelayMs;
    private readonly minSesAttemptIntervalMs;
    private lastSesAttemptAt;
    constructor(app: FastifyInstance);
    send(campaign: Campaign, recipients: RecipientInput[], signal?: AbortSignal): Promise<EmailDispatchResult>;
    private sendWithRetry;
    private waitForSesRateLimit;
}
export {};
