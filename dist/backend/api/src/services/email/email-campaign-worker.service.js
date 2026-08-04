import { CampaignService } from "../campaign.service.js";
export class CampaignEmailWorkerService {
    app;
    constructor(app) {
        this.app = app;
    }
    async process(job, context) {
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
//# sourceMappingURL=email-campaign-worker.service.js.map