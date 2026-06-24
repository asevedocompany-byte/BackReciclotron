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
    constructor(app: FastifyInstance);
    send(campaign: Campaign, recipients: RecipientInput[]): Promise<EmailDispatchResult>;
}
export {};
