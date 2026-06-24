import { createCollectionPointSchema, updateCollectionPointSchema } from "@reciclotron/contracts";
import { CollectionPointService } from "../services/collection-point.service.js";
export class CollectionPointController {
    async list(request, reply) {
        const query = request.query;
        const filters = { search: query.search, status: query.status ? query.status === "true" : undefined };
        console.log('[CollectionPointController] Recebida requisição para listar pontos de coleta:', filters);
        try {
            const result = await new CollectionPointService(request.server).list(filters);
            console.log('[CollectionPointController] Listagem finalizada com sucesso:', { count: result.length, data: result });
            return reply.send(result);
        }
        catch (err) {
            console.error('[CollectionPointController] Erro ao listar pontos de coleta:', err instanceof Error
                ? { name: err.name, message: err.message }
                : { name: "UnknownError", message: String(err) });
            throw err;
        }
    }
    async getById(request, reply) {
        const result = await new CollectionPointService(request.server).findById(request.params.id);
        if (!result)
            return reply.code(404).send({ message: "Collection point not found" });
        return reply.send(result);
    }
    async create(request, reply) {
        return reply.code(201).send(await new CollectionPointService(request.server).create(createCollectionPointSchema.parse(request.body)));
    }
    async update(request, reply) {
        const result = await new CollectionPointService(request.server).update(request.params.id, updateCollectionPointSchema.parse(request.body));
        if (!result)
            return reply.code(404).send({ message: "Collection point not found" });
        return reply.send(result);
    }
    async delete(request, reply) {
        const success = await new CollectionPointService(request.server).delete(request.params.id);
        if (!success)
            return reply.code(404).send({ message: "Collection point not found" });
        return reply.code(204).send();
    }
}
//# sourceMappingURL=collection-point.controller.js.map