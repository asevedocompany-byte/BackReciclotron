import type { FastifyReply, FastifyRequest } from "fastify";
export declare class PointsLedgerController {
    list(request: FastifyRequest<{
        Querystring: {
            userId?: string;
            limit?: string;
            offset?: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    latestByUser(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    create(request: FastifyRequest, reply: FastifyReply): Promise<never>;
}
