import fp from "fastify-plugin";
import { RepositoryRegistry, LegacyDbAdapter } from "@reciclotron/db";
import type { EmailProvider, SmsProvider } from "@reciclotron/domain";
import { MockEmailProvider, MockSmsProvider } from "@reciclotron/integrations";
import { EndUserRepository as LegacyEndUserRepository } from "../repositories/end-user.repository.js";

declare module "fastify" {
  interface FastifyInstance {
    container: {
      repositories: RepositoryRegistry;
      legacyEndUsers: LegacyEndUserRepository;
      providers: { email: EmailProvider; sms: SmsProvider; };
      legacyDb: LegacyDbAdapter;
    };
  }
}

export default fp(async (app) => {
  app.decorate("container", {
    repositories: new RepositoryRegistry(),
    legacyEndUsers: new LegacyEndUserRepository(),
    providers: { email: new MockEmailProvider(), sms: new MockSmsProvider() },
    legacyDb: new LegacyDbAdapter()
  });
});
