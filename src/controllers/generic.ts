import type { FastifyReply, FastifyRequest } from "fastify";
export const sendOk = async (reply: FastifyReply, payload: unknown) => reply.send(payload);
export const getParamId = (request: FastifyRequest) => (request.params as { id: string }).id;
