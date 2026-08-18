import type { FastifyReply, FastifyRequest } from "fastify";
import { updateEndUserSchema } from "@reciclotron/contracts";
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

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const data = updateEndUserSchema.parse(request.body);
    const user = await new EndUserService(request.server).update(id, data);
    if (!user) return reply.code(404).send({ message: "Usuário não encontrado." });
    return reply.send(user);
  }
}
