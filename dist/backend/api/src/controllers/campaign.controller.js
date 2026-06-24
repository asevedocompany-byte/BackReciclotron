import { z } from "zod";
import { createCampaignSchema } from "@reciclotron/contracts";
import { CampaignService } from "../services/campaign.service.js";
const sendCampaignSchema = z.object({
    recipientIds: z.array(z.union([z.string(), z.number()])).optional()
});
export class CampaignController {
    createService(request) {
        return new CampaignService(request.server);
    }
    async list(request, reply) {
        console.info("[CampaignController] list called");
        const service = this.createService(request);
        return reply.send(await service.list());
    }
    async create(request, reply) {
        console.info("[CampaignController] create called");
        const service = this.createService(request);
        const payload = createCampaignSchema.parse(request.body);
        return reply.code(201).send(await service.create(payload));
    }
    async send(request, reply) {
        console.info("[CampaignController] send called", { campaignId: request.params.id });
        const service = this.createService(request);
        const { recipientIds } = sendCampaignSchema.parse((request.body ?? {}));
        return reply.send(await service.send(request.params.id, recipientIds));
    }
    async getRecipients(request, reply) {
        console.info("[CampaignController] getRecipients called", { campaignId: request.params.id });
        const service = this.createService(request);
        return reply.send(await service.getRecipients(request.params.id));
    }
}
//# sourceMappingURL=campaign.controller.js.map