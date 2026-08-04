import type { FastifyInstance } from "fastify";
import type { SmsCampaignDispatchContext, SmsCampaignDispatchJob } from "./sms.types.js";
export declare class SmsCampaignWorkerService {
    private readonly app;
    constructor(app: FastifyInstance);
    process(job: SmsCampaignDispatchJob, context: SmsCampaignDispatchContext): Promise<void>;
}
