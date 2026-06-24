import type { FastifyReply, FastifyRequest } from "fastify";
export declare const sendOk: (reply: FastifyReply, payload: unknown) => Promise<never>;
export declare const getParamId: (request: FastifyRequest) => string;
