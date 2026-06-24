import fp from "fastify-plugin";
import { RepositoryRegistry, LegacyDbAdapter } from "@reciclotron/db";
import { MockEmailProvider, MockSmsProvider } from "@reciclotron/integrations";
export default fp(async (app) => {
    app.decorate("container", {
        repositories: new RepositoryRegistry(),
        providers: { email: new MockEmailProvider(), sms: new MockSmsProvider() },
        legacyDb: new LegacyDbAdapter()
    });
});
//# sourceMappingURL=container.js.map