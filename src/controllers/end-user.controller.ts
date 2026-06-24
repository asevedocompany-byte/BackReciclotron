import type { FastifyReply, FastifyRequest } from "fastify";
import { EndUserService } from "../services/end-user.service.js";

export class EndUserController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const service = new EndUserService(request.server);
    const users = await service.list();
    return reply.send(users);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const service = new EndUserService(request.server);
    const user = await service.findById(id);
    if (!user) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }
    return reply.send(user);
  }
}
