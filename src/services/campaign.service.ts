import type { FastifyInstance } from "fastify";
import type { Campaign, CreateCampaignInput, EndUser } from "@reciclotron/contracts";
import { AppError } from "../shared/errors/app-error.js";
import { AudienceSegmentService } from "./audience-segment.service.js";
import { EmailDispatchService } from "./email/email-dispatch.service.js";

const SES_TEST_RECIPIENTS = [
  { legacyId: 900001, email: "joao-victor_07@outlook.com" },
  { legacyId: 900002, email: "jvictor.asevedo@gmail.com" }
];

export class CampaignService {
  private readonly audienceSegmentService: AudienceSegmentService;
  private emailDispatchService?: EmailDispatchService;

  constructor(private readonly app: FastifyInstance) {
    this.audienceSegmentService = new AudienceSegmentService(app);
  }

  list() {
    console.info("[CampaignService] list called");
    return this.app.container.repositories.campaigns.findAll();
  }

  async create(input: CreateCampaignInput) {
    console.info("[CampaignService] create called", {
      channel: input.channel,
      segmentId: input.segmentId,
      hasRecipientIds: Array.isArray(input.recipientIds) && input.recipientIds.length > 0
    });
    const recipients = await this.audienceSegmentService.resolveRecipients(input.segmentId);
    console.info("[CampaignService] create resolved recipients", { count: recipients.length });
    const estimatedCost = input.channel === "sms"
      ? (await this.app.container.providers.sms.estimateCost({
          recipients: recipients.map((item) => item.phone).filter(Boolean) as string[],
          message: input.message
        })).estimatedCost
      : 0;

    console.info("[CampaignService] create persisting campaign");
    return this.app.container.repositories.campaigns.create({
      ...input,
      status: input.status ?? "draft",
      estimatedCost,
      providerMessageId: null,
      sentAt: null
    });
  }

  private async resolveRecipients(campaign: Campaign, recipientIds?: (string | number)[]): Promise<EndUser[]> {
    console.info("[CampaignService] resolveRecipients called", {
      campaignId: campaign.id,
      mode: recipientIds && recipientIds.length > 0 ? "explicit_ids" : "segment"
    });
    if (recipientIds && recipientIds.length > 0) {
      const numericIds = recipientIds.map((id) => Number(id)).filter((id) => !isNaN(id));
      console.info("[CampaignService] resolveRecipients explicit ids", {
        campaignId: campaign.id,
        recipientIds,
        numericIds,
        numericIdsCount: numericIds.length
      });
      return this.app.container.legacyEndUsers.findByIds(numericIds);
    }

    return this.audienceSegmentService.resolveRecipients(campaign.segmentId);
  }

  async send(campaignId: string, recipientIds?: (string | number)[]) {
    console.info("[CampaignService] send called", {
      campaignId,
      recipientIdsCount: recipientIds?.length ?? 0
    });
    const campaign = await this.app.container.repositories.campaigns.findById(campaignId);

    if (!campaign) {
      throw new AppError(404, "Campanha nao encontrada.");
    }

    const recipients = await this.resolveRecipients(campaign, recipientIds);
    console.info("[CampaignService] send recipients resolved", {
      campaignId: campaign.id,
      count: recipients.length
    });
    console.info("[CampaignService] send recipients sample", {
      campaignId: campaign.id,
      sample: recipients.slice(0, 3).map((recipient) => ({
        id: recipient.id,
        name: recipient.name,
        email: recipient.email
      }))
    });

    if (recipients.length === 0) {
      throw new AppError(400, "Informe recipientIds ou um segmento com destinatarios validos para a campanha.");
    }

    if (campaign.channel === "email") {
      console.info("[CampaignService] send email campaign recipients found", {
        campaignId: campaign.id,
        count: recipients.filter((user) => Boolean(user.email)).length,
        sample: recipients.slice(0, 3).map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          email: recipient.email
        }))
      });

      console.info("[CampaignService] send using SES test recipients", {
        campaignId: campaign.id,
        recipients: SES_TEST_RECIPIENTS
      });

      const dispatchService = this.emailDispatchService ??= new EmailDispatchService(this.app);
      const dispatchResult = await dispatchService.send(campaign, SES_TEST_RECIPIENTS);
      console.info("[CampaignService] send email dispatch completed", {
        campaignId: campaign.id,
        providerMessageId: dispatchResult.providerMessageId,
        accepted: dispatchResult.accepted,
        rejected: dispatchResult.rejected
      });

      // Grava no banco de dados o histórico de todos os destinatários resolvidos reais da campanha
      const dbRecipients = recipients.map((user) => ({
        campaignId: campaign.id,
        legacyId: Number(user.id),
        email: user.email || "",
        status: user.email ? "sent" as const : "failed" as const,
        messageId: dispatchResult.providerMessageId || null,
        errorReason: user.email ? null : "E-mail não cadastrado",
        sentAt: new Date().toISOString()
      }));

      await this.app.container.repositories.campaignRecipients.createMany(dbRecipients);

      console.info("[CampaignService] send updating campaign as sent", { campaignId: campaign.id });
      return this.app.container.repositories.campaigns.update({
        ...campaign,
        providerMessageId: dispatchResult.providerMessageId,
        status: "sent",
        sentAt: new Date().toISOString()
      } as Campaign);
    }

    console.info("[CampaignService] send sms dispatch starting", {
      campaignId: campaign.id,
      count: recipients.map((item) => item.phone).filter(Boolean).length
    });
    await this.app.container.providers.sms.sendCampaign({
      message: campaign.message,
      recipients: recipients.map((item) => item.phone).filter(Boolean) as string[]
    });

    console.info("[CampaignService] send sms dispatch completed", { campaignId: campaign.id });

    // Grava no banco de dados o histórico de todos os destinatários resolvidos reais da campanha SMS
    const dbRecipientsSms = recipients.map((user) => ({
      campaignId: campaign.id,
      legacyId: Number(user.id),
      email: user.email || "",
      status: user.phone ? "sent" as const : "failed" as const,
      messageId: null,
      errorReason: user.phone ? null : "Telefone não cadastrado",
      sentAt: new Date().toISOString()
    }));

    await this.app.container.repositories.campaignRecipients.createMany(dbRecipientsSms);

    return this.app.container.repositories.campaigns.update({
      ...campaign,
      status: "sent",
      sentAt: new Date().toISOString()
    });
  }

  getRecipients(campaignId: string) {
    console.info("[CampaignService] getRecipients called", { campaignId });
    return this.app.container.repositories.campaignRecipients.findByCampaign(campaignId);
  }
}
