import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createCampaignSchema } from "@reciclotron/contracts";
import { CampaignService } from "../services/campaign.service.js";

const sendCampaignSchema = z.object({
  recipientIds: z.array(z.union([z.string(), z.number()])).optional()
});

export class CampaignController {
  private createService(request: FastifyRequest) {
    return new CampaignService(request.server);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    console.info("[CampaignController] list called");
    const service = this.createService(request);
    return reply.send(await service.list());
  }

  async getQuotaBilling(request: FastifyRequest, reply: FastifyReply) {
    console.info("[CampaignController] getQuotaBilling called");
    const service = this.createService(request);
    return reply.send(await service.getQuotaAndBilling());
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    console.info("[CampaignController] create called");
    const service = this.createService(request);
    const payload = createCampaignSchema.parse(request.body);
    return reply.code(201).send(await service.create(payload));
  }

  async send(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    console.info("[CampaignController] send called", { campaignId: request.params.id });
    const service = this.createService(request);
    const payload = sendCampaignSchema.parse((request.body ?? {}) as unknown);
    console.info("[CampaignController] send payload received", {
      campaignId: request.params.id,
      hasBody: Boolean(request.body),
      bodyKeys: request.body && typeof request.body === "object" ? Object.keys(request.body as Record<string, unknown>) : [],
      recipientIdsCount: payload.recipientIds?.length ?? 0,
      recipientIdsSample: payload.recipientIds?.slice(0, 5) ?? [],
      recipientIdsTypes: payload.recipientIds?.slice(0, 5).map((id) => typeof id) ?? []
    });
    const { recipientIds } = payload;
    return reply.code(202).send(await service.send(request.params.id, recipientIds));
  }

  async getRecipients(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    console.info("[CampaignController] getRecipients called", { campaignId: request.params.id });
    const service = this.createService(request);
    return reply.send(await service.getRecipients(request.params.id));
  }

  async getStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    console.info("[CampaignController] getStatus called", { campaignId: request.params.id });
    const service = this.createService(request);
    return reply.send(await service.getDispatchStatus(request.params.id));
  }

  async streamStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const campaignId = request.params.id;
    console.info("[CampaignController] streamStatus deprecated", { campaignId });
    return reply.code(410).send({
      message: "Fluxo SSE desativado. Use a listagem e refresh manual."
    });
  }

  async streamJobStatus(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    const jobId = request.params.jobId;
    console.info("[CampaignController] streamJobStatus deprecated", { jobId });
    return reply.code(410).send({
      message: "Fluxo SSE desativado. Use a listagem e refresh manual."
    });
  }
}
