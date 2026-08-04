import type { FastifyInstance } from "fastify";
import type { CampaignDispatchContext, CampaignDispatchJob } from "./email-campaign-queue.service.js";
export declare class CampaignEmailWorkerService {
    private readonly app;
    constructor(app: FastifyInstance);
    process(job: CampaignDispatchJob, context: CampaignDispatchContext): Promise<void>;
}
