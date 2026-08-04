import type { FastifyInstance } from "fastify";
import type { Campaign, CreateCampaignInput, EndUser } from "@reciclotron/contracts";
import { getConfig } from "@reciclotron/config";
import { prisma } from "@reciclotron/db";
import { AmazonSesEmailAdapter } from "./email/email-ses.adapter.js";
import { AppError } from "../shared/errors/app-error.js";
import { AudienceSegmentService } from "./audience-segment.service.js";
import { EmailDispatchService } from "./email/email-dispatch.service.js";
import { SmsRecipientResolverService } from "./sms/sms-recipient-resolver.service.js";
import type { SmsQueueState, SmsRecipient } from "./sms/sms.types.js";

type CampaignDispatchState = {
  campaignId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  totalRecipients: number;
  processedRecipients: number;
  acceptedRecipients: number;
  rejectedRecipients: number;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorReason: string | null;
};

const SMS_TEST_PHONE_NUMBER = "+5522997892095";
const SMS_TEST_RECIPIENT_COUNT = 4;

function mapSmsQueueStateToDispatchState(state: SmsQueueState, fallbackQueuedAt: string): CampaignDispatchState {
  return {
    campaignId: state.campaignId,
    status: state.status === "completed"
      ? "completed"
      : state.status === "running"
        ? "running"
        : state.status === "queued"
          ? "queued"
          : "failed",
    progress: state.percent,
    totalRecipients: state.total,
    processedRecipients: state.processed,
    acceptedRecipients: state.sent,
    rejectedRecipients: state.failed,
    queuedAt: fallbackQueuedAt,
    startedAt: state.startedAt,
    completedAt: state.finishedAt,
    errorReason: state.errorReason
  };
}

export class CampaignService {
  private readonly audienceSegmentService: AudienceSegmentService;
  private readonly sesAdapter = new AmazonSesEmailAdapter();
  private emailDispatchService?: EmailDispatchService;

  constructor(private readonly app: FastifyInstance) {
    this.audienceSegmentService = new AudienceSegmentService(app);
  }

  private async persistSmsPendingRecipients(
    campaignId: string,
    recipients: Array<Pick<SmsRecipient, "legacyId" | "phoneRaw" | "phoneE164" | "recipientName" | "isValid" | "normalizationError"> & {
      email?: string | null;
    }>
  ) {
    const queuedAt = new Date().toISOString();
    await this.app.container.repositories.campaignRecipients.upsertMany(
      recipients.map((recipient) => ({
        campaignId,
        legacyId: recipient.legacyId,
        email: recipient.email ?? "",
        phone: recipient.phoneE164 ?? recipient.phoneRaw ?? null,
        recipientName: recipient.recipientName ?? null,
        status: "pending" as const,
        messageId: null,
        errorReason: null,
        sentAt: queuedAt
      }))
    );
  }

  private buildSmsMockRecipients(message: string): Array<SmsRecipient> {
    return Array.from({ length: SMS_TEST_RECIPIENT_COUNT }, (_, index) => {
      const sequence = index + 1;
      return {
        legacyId: 990000 + sequence,
        phoneRaw: SMS_TEST_PHONE_NUMBER,
        phoneE164: SMS_TEST_PHONE_NUMBER,
        email: `sms-teste-${sequence}@mock.local`,
        recipientName: `Teste SMS ${sequence}`,
        isValid: true,
        normalizationError: null
      } as SmsRecipient;
    });
  }

  private async recoverInterruptedSmsDispatch(campaign: Campaign) {
    if (campaign.channel !== "sms" || campaign.status !== "scheduled") return;

    const queueState = this.app.container.smsCampaignQueue.getStatus(campaign.id);
    if (queueState) return;

    const recipients = await this.app.container.repositories.campaignRecipients.findByCampaign(campaign.id);
    if (recipients.length === 0) return;

    const pendingRecipients = recipients.filter((recipient) => recipient.status === "pending");
    const allSent = recipients.length > 0 && recipients.every((recipient) => recipient.status === "sent");

    if (pendingRecipients.length > 0) {
      const interruptedAt = new Date().toISOString();
      for (const recipient of pendingRecipients) {
        const { id: _recipientId, ...recipientData } = recipient;
        await this.app.container.repositories.campaignRecipients.upsert({
          ...recipientData,
          status: "failed",
          messageId: recipient.messageId ?? null,
          errorReason: recipient.errorReason ?? "Envio interrompido antes da conclusão.",
          sentAt: interruptedAt
        });
      }
    }

    if (allSent) {
      const completedAt = recipients.reduce((latest, recipient) => (recipient.sentAt > latest ? recipient.sentAt : latest), campaign.createdAt);
      await this.app.container.repositories.campaigns.update({
        ...campaign,
        status: "sent",
        providerMessageId: campaign.providerMessageId ?? recipients[0]?.messageId ?? null,
        sentAt: completedAt
      });
    }
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
      attachments: input.attachments ?? [],
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
      const numericIds = new Set<number>();
      const historicalRecipientIds: string[] = [];

      for (const id of recipientIds) {
        const rawId = String(id).trim();
        if (!rawId) continue;

        const parsed = Number(rawId);
        if (Number.isInteger(parsed) && String(parsed) === rawId) {
          numericIds.add(parsed);
          continue;
        }

        historicalRecipientIds.push(rawId);
      }

      if (historicalRecipientIds.length > 0) {
        const historicalRecipients = await this.app.container.repositories.campaignRecipients.findByIds(historicalRecipientIds);
        for (const historicalRecipient of historicalRecipients) {
          numericIds.add(historicalRecipient.legacyId);
        }
      }

      const resolvedIds = Array.from(numericIds);
      const legacyRecipients = resolvedIds.length > 0
        ? await this.app.container.legacyEndUsers.findByIds(resolvedIds)
        : [];

      if (legacyRecipients.length > 0) {
        console.info("[CampaignService] resolveRecipients explicit ids resolved via legacy db", {
          campaignId: campaign.id,
          resolvedCount: legacyRecipients.length
        });
        return legacyRecipients;
      }

      const historicalRecipients = await this.app.container.repositories.campaignRecipients.findByCampaign(campaign.id);
      const historicalRecipientSet = new Set(resolvedIds);
      const matchedHistoricalRecipients = historicalRecipients.filter((recipient) => (
        historicalRecipientSet.size === 0 || historicalRecipientSet.has(recipient.legacyId)
      ));

      if (matchedHistoricalRecipients.length > 0) {
        console.info("[CampaignService] resolveRecipients explicit ids resolved via campaign history", {
          campaignId: campaign.id,
          resolvedCount: matchedHistoricalRecipients.length
        });
        return matchedHistoricalRecipients.map((recipient) => ({
          id: String(recipient.legacyId),
          email: recipient.email,
          name: recipient.email,
          city: "Sem Cidade",
          status: "active",
          pointsBalance: 0,
          phone: null,
          createdAt: recipient.sentAt,
          updatedAt: recipient.sentAt
        }));
      }

      console.info("[CampaignService] resolveRecipients explicit ids", {
        campaignId: campaign.id,
        recipientIds,
        numericIds: resolvedIds,
        numericIdsCount: resolvedIds.length,
        historicalRecipientIdsCount: historicalRecipientIds.length
      });
      return [];
    }

    return this.audienceSegmentService.resolveRecipients(campaign.segmentId);
  }

  private async resolveSmsRecipients(campaign: Campaign, recipientIds?: (string | number)[]) {
    console.info("[CampaignService] resolveSmsRecipients called", {
      campaignId: campaign.id,
      mode: recipientIds && recipientIds.length > 0 ? "explicit_ids" : "segment"
    });

    const baseRecipients = recipientIds && recipientIds.length > 0
      ? await this.resolveRecipients(campaign, recipientIds)
      : await this.audienceSegmentService.resolveRecipients(campaign.segmentId);

    console.info("[CampaignService] resolveSmsRecipients base recipients", {
      campaignId: campaign.id,
      count: baseRecipients.length
    });

    if (baseRecipients.length === 0) {
      return [];
    }

    const resolver = new SmsRecipientResolverService(this.app);
    const resolvedRecipients = await resolver.resolveByIds(baseRecipients.map((recipient) => recipient.id));
    const validRecipients = resolvedRecipients.filter((recipient) => recipient.isValid);

    console.info("[CampaignService] resolveSmsRecipients resolved", {
      campaignId: campaign.id,
      totalRecipients: resolvedRecipients.length,
      validRecipients: validRecipients.length,
      invalidRecipients: resolvedRecipients.length - validRecipients.length
    });

    return validRecipients;
  }

  private throwIfAborted(signal?: AbortSignal) {
    if (!signal?.aborted) return;
    throw signal.reason instanceof Error ? signal.reason : new Error("Operação cancelada por timeout.");
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

    if (campaign.channel !== "email") {
      console.info("[CampaignService] send sms pipeline starting", {
        campaignId: campaign.id,
        step: "resolve_recipients"
      });

      const resolvedRecipients = await this.resolveSmsRecipients(campaign, recipientIds);
      console.info("[CampaignService] send sms recipients ready", {
        campaignId: campaign.id,
        totalRecipients: resolvedRecipients.length,
        sample: resolvedRecipients.slice(0, 3).map((recipient) => ({
          legacyId: recipient.legacyId,
          phoneE164: recipient.phoneE164,
          hasEmail: Boolean(recipient.email)
        }))
      });

      const smsRecipients = this.buildSmsMockRecipients(campaign.message);
      console.info("[CampaignService] send sms mock recipients ready", {
        campaignId: campaign.id,
        totalRecipients: smsRecipients.length,
        sample: smsRecipients.map((recipient) => ({
          legacyId: recipient.legacyId,
          phoneE164: recipient.phoneE164,
          recipientName: recipient.recipientName
        }))
      });

      await this.persistSmsPendingRecipients(campaign.id, smsRecipients);

      const smsQueue = this.app.container.smsCampaignQueue;
      const queueState = smsQueue.enqueue({
        campaignId: campaign.id,
        message: campaign.message,
        recipients: smsRecipients,
        totalRecipients: smsRecipients.length,
        batchSize: getConfig().SMS_DISPATCH_BATCH_SIZE
      });

      console.info("[CampaignService] send sms queued for worker", {
        campaignId: campaign.id,
        queueState,
        nextStep: "worker_dispatch"
      });

      await this.app.container.repositories.campaigns.update({
        ...campaign,
        status: "scheduled",
        providerMessageId: campaign.providerMessageId ?? null,
        sentAt: null
      } as Campaign);

      return {
        ...campaign,
        status: "scheduled",
        sentAt: null,
        dispatchJobId: queueState.jobId,
        dispatchState: mapSmsQueueStateToDispatchState(queueState, campaign.createdAt)
      } as Campaign & {
        dispatchJobId: string;
        dispatchState: CampaignDispatchState;
      };
    }

    const resolvedRecipients = await this.resolveRecipients(campaign, recipientIds);
    const emailRecipients = resolvedRecipients
      .map((recipient) => ({ legacyId: Number(recipient.id), email: recipient.email?.trim() ?? "" }))
      .filter((recipient) => Number.isInteger(recipient.legacyId) && recipient.email.length > 0);

    if (emailRecipients.length === 0) {
      throw new AppError(400, "Nenhum usuário selecionado possui um email válido.");
    }

    console.info("[CampaignService] send email recipients resolved", {
      campaignId: campaign.id,
      requestedRecipientIds: recipientIds?.length ?? 0,
      resolvedRecipients: resolvedRecipients.length,
      validEmailRecipients: emailRecipients.length
    });

    const queue = this.app.container.emailCampaignQueue;
    const queueState = queue.enqueue({
      campaignId: campaign.id,
      recipientIds: emailRecipients.map((recipient) => recipient.legacyId),
      totalRecipients: emailRecipients.length
    });

    console.info("[CampaignService] send queued", {
      campaignId: campaign.id,
      queueState
    });

    await this.app.container.repositories.campaigns.update({
      ...campaign,
      status: "scheduled",
      providerMessageId: campaign.providerMessageId ?? null,
      sentAt: null
    } as Campaign);

    return {
      ...campaign,
      status: "scheduled",
      sentAt: null,
      queuedAt: queueState.queuedAt,
      dispatchStatus: queueState.status,
      dispatchProgress: queueState.progress,
      dispatchTotalRecipients: queueState.totalRecipients
    } as Campaign & {
      queuedAt: string;
      dispatchStatus: string;
      dispatchProgress: number;
      dispatchTotalRecipients: number;
    };
  }

  async executeSend(campaignId: string, recipientIds?: (string | number)[], totalRecipientsHint?: number, signal?: AbortSignal) {
    console.info("[CampaignService] executeSend called", {
      campaignId,
      recipientIdsCount: recipientIds?.length ?? 0,
      totalRecipientsHint: totalRecipientsHint ?? null
    });
    this.throwIfAborted(signal);
    const queue = this.app.container.emailCampaignQueue;
    const campaign = await this.app.container.repositories.campaigns.findById(campaignId);

    if (!campaign) {
      throw new AppError(404, "Campanha nao encontrada.");
    }

    queue.updateStatus(campaign.id, {
      status: "running",
      progress: 10,
      startedAt: new Date().toISOString()
    });

    if (campaign.channel !== "email") {
      console.info("[CampaignService] executeSend sms path deprecated", {
        campaignId: campaign.id,
        message: "SMS agora usa smsCampaignQueue e SmsCampaignWorkerService"
      });
      throw new AppError(500, "Fluxo SMS agora usa a fila smsCampaignQueue e o worker dedicado.");
    }

    const resolvedRecipients = await this.resolveRecipients(campaign, recipientIds);
    const emailRecipients = resolvedRecipients
      .map((recipient) => ({ legacyId: Number(recipient.id), email: recipient.email?.trim() ?? "" }))
      .filter((recipient) => Number.isInteger(recipient.legacyId) && recipient.email.length > 0);

    if (emailRecipients.length === 0) {
      throw new AppError(400, "Nenhum usuário selecionado possui um email válido.");
    }

    queue.updateStatus(campaign.id, {
      progress: 25,
      totalRecipients: totalRecipientsHint ?? emailRecipients.length,
      processedRecipients: 0,
      acceptedRecipients: 0,
      rejectedRecipients: 0
    });

    queue.updateStatus(campaign.id, {
      progress: 40
    });

    console.info("[CampaignService] executeSend using selected email recipients", {
      campaignId: campaign.id,
      totalRecipients: emailRecipients.length,
      sample: emailRecipients.slice(0, 3)
    });

    this.throwIfAborted(signal);
    const dispatchService = this.emailDispatchService ??= new EmailDispatchService(this.app);
    const dispatchResult = await dispatchService.send(campaign, emailRecipients, signal);
    console.info("[CampaignService] executeSend email dispatch completed", {
      campaignId: campaign.id,
      providerMessageId: dispatchResult.providerMessageId,
      accepted: dispatchResult.accepted,
      rejected: dispatchResult.rejected
    });

    const totalRecipients = emailRecipients.length;
    const dbRecipients = [];
    let acceptedRecipients = 0;
    let rejectedRecipients = 0;
    for (let index = 0; index < emailRecipients.length; index += 1) {
      this.throwIfAborted(signal);
      const user = emailRecipients[index];
      acceptedRecipients += 1;
      dbRecipients.push({
        campaignId: campaign.id,
        legacyId: Number(user.legacyId),
        email: user.email,
        phone: null,
        recipientName: null,
        status: "sent" as const,
        messageId: dispatchResult.providerMessageId || null,
        errorReason: null,
        sentAt: new Date().toISOString()
      });

      const processedRecipients = index + 1;
      const progress = 50 + Math.round((processedRecipients / totalRecipients) * 40);
      queue.updateStatus(campaign.id, {
        progress,
        processedRecipients,
        acceptedRecipients,
        rejectedRecipients
      });

      if (
        processedRecipients === 1 ||
        processedRecipients % 50 === 0 ||
        processedRecipients === totalRecipients
      ) {
        console.info("[CampaignService] executeSend progress", {
          campaignId: campaign.id,
          processedRecipients,
          totalRecipients,
          acceptedRecipients,
          rejectedRecipients,
          progress
        });
      }
    }

    queue.updateStatus(campaign.id, {
      progress: 85
    });

    const recipientsPayload = dbRecipients.map((user) => ({
      campaignId: campaign.id,
      legacyId: user.legacyId,
      email: user.email,
      phone: user.phone,
      recipientName: user.recipientName,
      status: user.status,
      messageId: user.messageId,
      errorReason: user.errorReason,
      sentAt: user.sentAt
    }));

    await this.app.container.repositories.campaignRecipients.deleteByCampaign(campaign.id);
    await this.app.container.repositories.campaignRecipients.createMany(recipientsPayload);

    queue.updateStatus(campaign.id, { progress: 90 });

    console.info("[CampaignService] executeSend updating campaign as sent", { campaignId: campaign.id });
    this.throwIfAborted(signal);
    const updated = await this.app.container.repositories.campaigns.update({
      ...campaign,
      providerMessageId: dispatchResult.providerMessageId,
      status: "sent",
      sentAt: new Date().toISOString()
    } as Campaign);

    queue.updateStatus(campaign.id, {
      progress: 100,
      acceptedRecipients: dispatchResult.accepted,
      rejectedRecipients: dispatchResult.rejected,
      processedRecipients: emailRecipients.length,
      completedAt: new Date().toISOString()
    });

    return updated;
  }

  getRecipients(campaignId: string) {
    console.info("[CampaignService] getRecipients called", { campaignId });
    return (async () => {
      const campaign = await this.app.container.repositories.campaigns.findById(campaignId);
      if (!campaign) return [];
      await this.recoverInterruptedSmsDispatch(campaign);
      return this.app.container.repositories.campaignRecipients.findByCampaign(campaignId);
    })();
  }

  async getDispatchStatus(campaignId: string) {
    console.info("[CampaignService] getDispatchStatus called", { campaignId });
    const campaign = await this.app.container.repositories.campaigns.findById(campaignId);
    if (!campaign) return null;

    const queue = campaign.channel === "email"
      ? this.app.container.emailCampaignQueue
      : this.app.container.smsCampaignQueue;

    const state = queue.getStatus(campaignId);
    if (state) {
      return campaign.channel === "sms"
        ? mapSmsQueueStateToDispatchState(state as SmsQueueState, campaign.createdAt)
        : state;
    }

    if (campaign.channel === "sms") {
      const recipients = await this.app.container.repositories.campaignRecipients.findByCampaign(campaignId);
      if (campaign.status === "draft" || recipients.length === 0) {
        return {
          campaignId: campaign.id,
          status: "queued",
          progress: 0,
          totalRecipients: recipients.length,
          processedRecipients: 0,
          acceptedRecipients: 0,
          rejectedRecipients: 0,
          queuedAt: campaign.createdAt,
          startedAt: null,
          completedAt: null,
          errorReason: null
        };
      }

      await this.recoverInterruptedSmsDispatch(campaign);
      const refreshedRecipients = await this.app.container.repositories.campaignRecipients.findByCampaign(campaignId);
      const sentRecipients = refreshedRecipients.filter((recipient) => recipient.status === "sent").length;
      const failedRecipients = refreshedRecipients.filter((recipient) => recipient.status === "failed").length;
      const pendingRecipients = refreshedRecipients.filter((recipient) => recipient.status === "pending").length;
      const totalRecipients = refreshedRecipients.length;
      const processedRecipients = sentRecipients + failedRecipients;
      const completed = totalRecipients > 0 && pendingRecipients === 0 && failedRecipients === 0 && sentRecipients === totalRecipients;

      return {
        campaignId: campaign.id,
        status: completed ? "completed" : "failed",
        progress: totalRecipients > 0 ? Math.round((processedRecipients / totalRecipients) * 100) : 0,
        totalRecipients,
        processedRecipients,
        acceptedRecipients: sentRecipients,
        rejectedRecipients: failedRecipients + pendingRecipients,
        queuedAt: campaign.createdAt,
        startedAt: campaign.sentAt ?? campaign.createdAt,
        completedAt: completed ? campaign.sentAt ?? refreshedRecipients[0]?.sentAt ?? null : null,
        errorReason: completed ? null : "O envio foi interrompido. Reenvie os destinatários com erro."
      };
    }

    return {
      campaignId: campaign.id,
      status: campaign.status === "sent" ? "completed" : "queued",
      progress: campaign.status === "sent" ? 100 : 0,
      totalRecipients: 0,
      processedRecipients: 0,
      acceptedRecipients: 0,
      rejectedRecipients: 0,
      queuedAt: campaign.createdAt,
      startedAt: null,
      completedAt: campaign.sentAt,
      errorReason: null
    };
  }

  async getQuotaAndBilling() {
    const quota = await this.sesAdapter.getSendQuota();

    const campaigns = await this.app.container.repositories.campaigns.findAll();
    const sentCampaigns = campaigns.filter((c) => c.status === "sent");

    const emailRecipientsCount = await prisma.campaignRecipient.count({
      where: {
        status: "sent",
        email: { not: "" }
      }
    });

    const smsRecipientsCount = await prisma.campaignRecipient.count({
      where: {
        status: "sent",
        phone: { not: null }
      }
    });

    let totalAttachmentBytes = 0;
    for (const campaign of sentCampaigns) {
      if (campaign.channel === "email" && campaign.attachments && campaign.attachments.length > 0) {
        const campaignSentRecipientsCount = await prisma.campaignRecipient.count({
          where: {
            campaignId: campaign.id,
            status: "sent"
          }
        });

        for (const att of campaign.attachments) {
          try {
            const parsed = JSON.parse(att);
            if (parsed && typeof parsed.size === "number") {
              totalAttachmentBytes += parsed.size * campaignSentRecipientsCount;
            }
          } catch {}
        }
      }
    }

    const totalAttachmentGB = totalAttachmentBytes / (1024 * 1024 * 1024);
    const customerAttachmentCost = totalAttachmentGB * 1.50; // R$ 1.50 por GB para o cliente
    const customerEmailBaseCost = quota.sentLast24h * 0.00055;
    const customerSmsCost = smsRecipientsCount * 0.12;
    const customerTotalCost = customerEmailBaseCost + customerAttachmentCost + customerSmsCost;

    const awsEmailOutboundCostUsd = quota.sentLast24h * 0.0001;
    const awsAttachmentCostUsd = totalAttachmentGB * 0.12; // $0.12 por GB da AWS
    const totalCostUsd = awsEmailOutboundCostUsd + awsAttachmentCostUsd;
    const usdToBrlExchangeRate = 5.50;
    const totalCostBrl = totalCostUsd * usdToBrlExchangeRate;

    return {
      quota,
      cost: {
        customer: {
          emailCost: customerEmailBaseCost,
          attachmentCost: customerAttachmentCost,
          totalAttachmentGB,
          smsCost: customerSmsCost,
          totalCost: customerTotalCost
        },
        aws: {
          emailOutboundCostUsd: awsEmailOutboundCostUsd,
          attachmentCostUsd: awsAttachmentCostUsd,
          totalCostUsd,
          totalCostBrl,
          exchangeRate: usdToBrlExchangeRate
        }
      }
    };
  }
}
