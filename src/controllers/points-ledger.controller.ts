import type { FastifyReply, FastifyRequest } from "fastify";
import { createLedgerEntrySchema } from "@reciclotron/contracts";
import { PointsLedgerService } from "../services/points-ledger.service.js";
export class PointsLedgerController { async list(request: FastifyRequest, reply: FastifyReply) { return reply.send(await new PointsLedgerService(request.server).list()); } async create(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await new PointsLedgerService(request.server).create(createLedgerEntrySchema.parse(request.body))); } }
