import { RepositoryRegistry, LegacyDbAdapter } from "@reciclotron/db";
import type { SmsProvider } from "@reciclotron/domain";
import { EndUserRepository as LegacyEndUserRepository } from "../repositories/end-user.repository.js";
import { CampaignEmailQueueService } from "../services/email/email-campaign-queue.service.js";
import { SmsCampaignQueueService } from "../services/sms/sms-campaign-queue.service.js";
declare module "fastify" {
    interface FastifyInstance {
        container: {
            repositories: RepositoryRegistry;
            legacyEndUsers: LegacyEndUserRepository;
            emailCampaignQueue: CampaignEmailQueueService;
            smsCampaignQueue: SmsCampaignQueueService;
            providers: {
                sms: SmsProvider;
            };
            legacyDb: LegacyDbAdapter;
        };
    }
}
declare const _default: (app: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>) => Promise<void>;
export default _default;
