import type { FastifyReply, FastifyRequest } from "fastify";
import { AdminUserService } from "../services/admin-user.service.js";
export class AdminUserController { async list(request: FastifyRequest, reply: FastifyReply) { return reply.send(await new AdminUserService(request.server).list()); } }
