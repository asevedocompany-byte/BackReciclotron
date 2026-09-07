import type { FastifyReply, FastifyRequest } from "fastify";
import { createCollectionPointSchema, updateCollectionPointSchema } from "@reciclotron/contracts";
import { CollectionPointService } from "../services/collection-point.service.js";

export class CollectionPointController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { search?: string; status?: string };
    const filters = { search: query.search, status: query.status ? query.status === "true" : undefined };
    console.log('[CollectionPointController] Recebida requisição para listar pontos de coleta:', filters);
    try {
      const result = await new CollectionPointService(request.server).list(filters);
      console.log('[CollectionPointController] Listagem finalizada com sucesso:', { count: result.length, data: result });
      return reply.send(result);
    } catch (err) {
      console.error('[CollectionPointController] Erro ao listar pontos de coleta:', err instanceof Error
        ? { name: err.name, message: err.message }
        : { name: "UnknownError", message: String(err) });
      throw err;
    }
  }
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const result = await new CollectionPointService(request.server).findById((request.params as { id: string }).id);
    if (!result) return reply.code(404).send({ message: "Collection point not found" });
    return reply.send(result);
  }
  async create(request: FastifyRequest, reply: FastifyReply) {
    console.log('[CollectionPointController] POST /api/collection-points - body recebido:', request.body);
    const payload = createCollectionPointSchema.parse(request.body);
    console.log('[CollectionPointController] POST /api/collection-points - body validado:', payload);
    console.log('[CollectionPointController] JSON enviado vs JSON aceito pelo schema:', JSON.stringify({
      jsonEnviado: request.body,
      jsonAceitoPeloSchema: payload
    }, null, 2));
    const result = await new CollectionPointService(request.server).create(payload);
    console.log('[CollectionPointController] POST /api/collection-points - resposta:', result);
    return reply.code(201).send(result);
  }
  async update(request: FastifyRequest, reply: FastifyReply) {
    const id = (request.params as { id: string }).id;
    console.log(`[CollectionPointController] PATCH /api/collection-points/${id} - body recebido:`, request.body);
    const payload = updateCollectionPointSchema.parse(request.body);
    console.log(`[CollectionPointController] PATCH /api/collection-points/${id} - body validado:`, payload);
    console.log(`[CollectionPointController] JSON enviado vs JSON aceito pelo schema (${id}):`, JSON.stringify({
      jsonEnviado: request.body,
      jsonAceitoPeloSchema: payload
    }, null, 2));
    const result = await new CollectionPointService(request.server).update(id, payload);
    if (!result) return reply.code(404).send({ message: "Collection point not found" });
    console.log(`[CollectionPointController] PATCH /api/collection-points/${id} - resposta:`, result);
    return reply.send(result);
  }
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const success = await new CollectionPointService(request.server).delete((request.params as { id: string }).id);
    if (!success) return reply.code(404).send({ message: "Collection point not found" });
    return reply.code(204).send();
  }
}
