import type { FastifyReply, FastifyRequest } from "fastify";
import { createAudienceSegmentSchema } from "@reciclotron/contracts";
import { AudienceSegmentService } from "../services/audience-segment.service.js";
export class AudienceSegmentController { async list(request: FastifyRequest, reply: FastifyReply) { return reply.send(await new AudienceSegmentService(request.server).list()); } async create(request: FastifyRequest, reply: FastifyReply) { return reply.code(201).send(await new AudienceSegmentService(request.server).create(createAudienceSegmentSchema.parse(request.body))); } }
