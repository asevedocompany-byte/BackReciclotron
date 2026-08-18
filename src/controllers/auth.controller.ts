import type { FastifyReply, FastifyRequest } from "fastify";

export class AuthController {
  async me(request: FastifyRequest, reply: FastifyReply) {
    await request.server.container.repositories.adminUsers.updateLastLogin(request.user.sub, new Date().toISOString());
    return reply.send({ user: request.user });
  }
}
