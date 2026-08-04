import type { FastifyReply, FastifyRequest } from "fastify";
export declare class CampaignController {
    private createService;
    list(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    getQuotaBilling(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    create(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    send(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    getRecipients(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    getStatus(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    streamStatus(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    streamJobStatus(request: FastifyRequest<{
        Params: {
            jobId: string;
        };
    }>, reply: FastifyReply): Promise<never>;
}
