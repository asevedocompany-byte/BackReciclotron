import type { FastifyReply, FastifyRequest } from "fastify";
import { createLedgerEntrySchema } from "@reciclotron/contracts";
import { PointsLedgerService } from "../services/points-ledger.service.js";
export class PointsLedgerController {
  async list(request: FastifyRequest<{ Querystring: { userId?: string; limit?: string; offset?: string } }>, reply: FastifyReply) {
    const { userId, limit, offset } = request.query;
    return reply.send(await new PointsLedgerService(request.server).list({
      userId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    }));
  }

  async latestByUser(request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await new PointsLedgerService(request.server).listLatestByUser());
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    return reply.code(201).send(await new PointsLedgerService(request.server).create(createLedgerEntrySchema.parse(request.body)));
  }

}
