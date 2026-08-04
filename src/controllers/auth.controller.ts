import type { FastifyReply, FastifyRequest } from "fastify";

export class AuthController {
  async me(request: FastifyRequest, reply: FastifyReply) {
    await request.server.container.repositories.adminUsers.updateLastLogin(request.user.sub, new Date().toISOString());
    console.info("[Auth] sessão administrativa confirmada", {
      requestId: request.id,
      userId: request.user.sub,
      email: request.user.email,
      role: request.user.role
    });
    return reply.send({ user: request.user });
  }
}
