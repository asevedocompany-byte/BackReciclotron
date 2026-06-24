import { createLedgerEntrySchema } from "@reciclotron/contracts";
import { PointsLedgerService } from "../services/points-ledger.service.js";
export class PointsLedgerController {
    async list(request, reply) { return reply.send(await new PointsLedgerService(request.server).list()); }
    async create(request, reply) { return reply.code(201).send(await new PointsLedgerService(request.server).create(createLedgerEntrySchema.parse(request.body))); }
}
//# sourceMappingURL=points-ledger.controller.js.map