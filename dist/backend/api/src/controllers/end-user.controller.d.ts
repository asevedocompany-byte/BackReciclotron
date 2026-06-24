import type { FastifyReply, FastifyRequest } from "fastify";
export declare class EndUserController {
    list(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    getById(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
}
