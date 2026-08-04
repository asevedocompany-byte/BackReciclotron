import type { FastifyInstance } from "fastify";
import { CampaignService } from "../campaign.service.js";
import type { CampaignDispatchContext, CampaignDispatchJob } from "./email-campaign-queue.service.js";

export class CampaignEmailWorkerService {
  constructor(private readonly app: FastifyInstance) {}

  async process(job: CampaignDispatchJob, context: CampaignDispatchContext) {
    console.info("[CampaignEmailWorker] process called", {
      campaignId: job.campaignId,
      totalRecipients: job.totalRecipients,
      timeoutMs: context.timeoutMs,
      runId: context.runId
    });
    const service = new CampaignService(this.app);
    await service.executeSend(job.campaignId, job.recipientIds, job.totalRecipients, context.signal);
  }
}
