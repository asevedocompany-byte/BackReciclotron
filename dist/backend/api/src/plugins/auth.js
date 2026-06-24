import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { getConfig } from "@reciclotron/config";
export default fp(async (app) => {
    const config = getConfig();
    await app.register(jwt, { secret: config.JWT_SECRET });
    app.decorate("authenticate", async (request, reply) => {
        await request.jwtVerify();
    });
});
//# sourceMappingURL=auth.js.map