import type { FastifyReply, FastifyRequest } from "fastify";
import { MetricsService } from "../services/metrics.service.js";
export class MetricsController { async dashboard(request: FastifyRequest, reply: FastifyReply) { return reply.send(await new MetricsService(request.server).getDashboard()); } }
