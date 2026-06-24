import type { FastifyReply, FastifyRequest } from "fastify";
import { createPartnerStoreSchema, updatePartnerStoreSchema } from "@reciclotron/contracts";
import { PartnerStoreService } from "../services/partner-store.service.js";

export class PartnerStoreController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { search?: string; status?: string };
    const filters = { search: query.search, status: query.status ? query.status === "true" : undefined };
    return reply.send(await new PartnerStoreService(request.server).list(filters));
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const result = await new PartnerStoreService(request.server).findById((request.params as { id: string }).id);
    if (!result) return reply.code(404).send({ message: "Partner store not found" });
    return reply.send(result);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    return reply.code(201).send(await new PartnerStoreService(request.server).create(createPartnerStoreSchema.parse(request.body)));
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const result = await new PartnerStoreService(request.server).update((request.params as { id: string }).id, updatePartnerStoreSchema.parse(request.body));
    if (!result) return reply.code(404).send({ message: "Partner store not found" });
    return reply.send(result);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const success = await new PartnerStoreService(request.server).delete((request.params as { id: string }).id);
    if (!success) return reply.code(404).send({ message: "Partner store not found" });
    return reply.code(204).send();
  }

  async listCategories(request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await new PartnerStoreService(request.server).listCategories());
  }
}
