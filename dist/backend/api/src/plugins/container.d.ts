import { RepositoryRegistry, LegacyDbAdapter } from "@reciclotron/db";
import type { EmailProvider, SmsProvider } from "@reciclotron/domain";
declare module "fastify" {
    interface FastifyInstance {
        container: {
            repositories: RepositoryRegistry;
            providers: {
                email: EmailProvider;
                sms: SmsProvider;
            };
            legacyDb: LegacyDbAdapter;
        };
    }
}
declare const _default: (app: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>) => Promise<void>;
export default _default;
