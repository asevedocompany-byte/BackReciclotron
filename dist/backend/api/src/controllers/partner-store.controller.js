import { createPartnerStoreSchema, updatePartnerStoreSchema } from "@reciclotron/contracts";
import { PartnerStoreService } from "../services/partner-store.service.js";
export class PartnerStoreController {
    async list(request, reply) {
        const query = request.query;
        const filters = { search: query.search, status: query.status ? query.status === "true" : undefined };
        return reply.send(await new PartnerStoreService(request.server).list(filters));
    }
    async getById(request, reply) {
        const result = await new PartnerStoreService(request.server).findById(request.params.id);
        if (!result)
            return reply.code(404).send({ message: "Partner store not found" });
        return reply.send(result);
    }
    async create(request, reply) {
        return reply.code(201).send(await new PartnerStoreService(request.server).create(createPartnerStoreSchema.parse(request.body)));
    }
    async update(request, reply) {
        const result = await new PartnerStoreService(request.server).update(request.params.id, updatePartnerStoreSchema.parse(request.body));
        if (!result)
            return reply.code(404).send({ message: "Partner store not found" });
        return reply.send(result);
    }
    async delete(request, reply) {
        const success = await new PartnerStoreService(request.server).delete(request.params.id);
        if (!success)
            return reply.code(404).send({ message: "Partner store not found" });
        return reply.code(204).send();
    }
    async listCategories(request, reply) {
        return reply.send(await new PartnerStoreService(request.server).listCategories());
    }
}
//# sourceMappingURL=partner-store.controller.js.map