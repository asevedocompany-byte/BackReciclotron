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
    const id = (request.params as { id: string }).id;
    console.info("[PartnerStoreController] update received", {
      requestId: request.id,
      id,
      body: request.body
    });
    try {
      const payload = updatePartnerStoreSchema.parse(request.body);
      console.info("[PartnerStoreController] update payload validated", {
        requestId: request.id,
        id,
        payload
      });
      const result = await new PartnerStoreService(request.server).update(id, payload);
      if (!result) {
        console.warn("[PartnerStoreController] update returned no store", { requestId: request.id, id });
        return reply.code(404).send({ message: "Partner store not found" });
      }
      console.info("[PartnerStoreController] update completed", {
        requestId: request.id,
        id,
        name: result.name,
        city: result.city
      });
      return reply.send(result);
    } catch (error) {
      console.error("[PartnerStoreController] update failed", {
        requestId: request.id,
        id,
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error)
      });
      throw error;
    }
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
