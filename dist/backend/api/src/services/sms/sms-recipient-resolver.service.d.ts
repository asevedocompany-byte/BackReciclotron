import type { FastifyInstance } from "fastify";
import type { EndUser } from "@reciclotron/contracts";
import type { SmsRecipient } from "./sms.types.js";
type ResolvedSmsRecipient = SmsRecipient & {
    user: EndUser;
};
export declare class SmsRecipientResolverService {
    private readonly app;
    private static readonly cache;
    private static readonly cacheTtlMs;
    constructor(app: FastifyInstance);
    resolveByIds(recipientIds: (string | number)[]): Promise<ResolvedSmsRecipient[]>;
}
export {};
