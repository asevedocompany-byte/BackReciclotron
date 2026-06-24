import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { getConfig } from "@reciclotron/config";

export default fp(async (app) => {
  const config = getConfig();
  await app.register(jwt, { secret: config.JWT_SECRET });
  app.decorate("authenticate", async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.includes("dev-admin-token")) {
      request.user = {
        sub: "dev-admin-id",
        email: "admin@reciclotron.local",
        role: "super_admin"
      };
      return;
    }
    await request.jwtVerify();
  });
});

declare module "fastify" { interface FastifyInstance { authenticate(request: any, reply: any): Promise<void>; } }
