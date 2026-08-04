import { createLedgerEntrySchema } from "@reciclotron/contracts";
import { PointsLedgerService } from "../services/points-ledger.service.js";
export class PointsLedgerController {
    async list(request, reply) {
        const { userId, limit, offset } = request.query;
        return reply.send(await new PointsLedgerService(request.server).list({
            userId,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined
        }));
    }
    async latestByUser(request, reply) {
        return reply.send(await new PointsLedgerService(request.server).listLatestByUser());
    }
    async create(request, reply) {
        return reply.code(201).send(await new PointsLedgerService(request.server).create(createLedgerEntrySchema.parse(request.body)));
    }
}
//# sourceMappingURL=points-ledger.controller.js.map