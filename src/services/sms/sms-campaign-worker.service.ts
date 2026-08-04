import type { FastifyInstance } from "fastify";
import type { Campaign } from "@reciclotron/contracts";
import { getConfig } from "@reciclotron/config";
import { SmsDispatchService } from "./sms-dispatch.service.js";
import { SmsDispatchError } from "./sms-errors.js";
import type { SmsCampaignDispatchContext, SmsCampaignDispatchJob } from "./sms.types.js";

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error("Operação de SMS cancelada."));
      return;
    }

    if (ms <= 0) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(signal?.reason instanceof Error ? signal.reason : new Error("Operação de SMS cancelada."));
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class SmsCampaignWorkerService {
  constructor(private readonly app: FastifyInstance) {}

  async process(job: SmsCampaignDispatchJob, context: SmsCampaignDispatchContext) {
    const config = getConfig();
    const intervalMs = config.SMS_DISPATCH_INTERVAL_MS;
    const batchSize = Math.max(1, job.batchSize || config.SMS_DISPATCH_BATCH_SIZE);
    console.info("[SmsCampaignWorker] process started", {
      campaignId: job.campaignId,
      jobId: job.jobId,
      runId: context.runId,
      timeoutMs: context.timeoutMs,
      intervalMs,
      batchSize,
      totalRecipients: job.totalRecipients,
      validRecipients: job.recipients.filter((recipient) => recipient.isValid).length,
      invalidRecipients: job.recipients.filter((recipient) => !recipient.isValid).length
    });
    console.info("[SmsCampaignWorker] dispatching to provider layer", {
      campaignId: job.campaignId,
      jobId: job.jobId,
      runId: context.runId,
      step: "provider_send"
    });

    const dispatchService = new SmsDispatchService(this.app);
    const campaign = await this.app.container.repositories.campaigns.findById(job.campaignId);
    if (!campaign) {
      throw new Error(`Campanha nao encontrada para persistencia do SMS: ${job.campaignId}`);
    }

    let acceptedRecipients = 0;
    let rejectedRecipients = 0;
    let lastMessageId: string | null = null;
    let interrupted = false;
    let interruptionReason: string | null = null;

    const batches: SmsCampaignDispatchJob["recipients"][] = [];
    for (let index = 0; index < job.recipients.length; index += batchSize) {
      batches.push(job.recipients.slice(index, index + batchSize));
    }

    console.info("[SmsCampaignWorker] batches prepared", {
      campaignId: job.campaignId,
      jobId: job.jobId,
      batches: batches.length,
      batchSize
    });

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const batch = batches[batchIndex];

      console.info("[SmsCampaignWorker] batch started", {
        campaignId: job.campaignId,
        jobId: job.jobId,
        batchIndex,
        batchSize: batch.length,
        sent: acceptedRecipients,
        failed: rejectedRecipients
      });

      for (let index = 0; index < batch.length; index += 1) {
        const recipient = batch[index];
        const recipientNumber = recipient.phoneE164 ?? recipient.phoneRaw ?? null;
        const globalIndex = batchIndex * batchSize + index;

        if (context.signal.aborted) {
          interrupted = true;
          interruptionReason = context.signal.reason instanceof Error ? context.signal.reason.message : "Operação de SMS cancelada.";
          break;
        }

        console.log("[SmsCampaignWorker] production dispatch preview", {
          timestamp: new Date().toISOString(),
          campaignId: job.campaignId,
          jobId: job.jobId,
          runId: context.runId,
          recipient: {
            legacyId: recipient.legacyId,
            phoneNumber: recipientNumber,
            recipientName: recipient.recipientName ?? null
          },
          message: job.message
        });

        try {
          const result = await dispatchService.send({
            ...job,
            recipients: [recipient],
            totalRecipients: job.totalRecipients
          }, context.signal);

          lastMessageId = result.providerMessageId;
          acceptedRecipients += 1;
          const now = new Date().toISOString();
          await this.app.container.repositories.campaignRecipients.upsert({
            campaignId: job.campaignId,
            legacyId: recipient.legacyId,
            email: recipient.email ?? "",
            phone: recipientNumber,
            recipientName: recipient.recipientName ?? null,
            status: "sent",
            messageId: result.providerMessageId,
            errorReason: null,
            sentAt: now
          });
        } catch (error) {
          rejectedRecipients += 1;
          const errorReason = error instanceof Error ? error.message : String(error);
          const now = new Date().toISOString();

          await this.app.container.repositories.campaignRecipients.upsert({
            campaignId: job.campaignId,
            legacyId: recipient.legacyId,
            email: recipient.email ?? "",
            phone: recipientNumber,
            recipientName: recipient.recipientName ?? null,
            status: "failed",
            messageId: null,
            errorReason,
            sentAt: now
          });

          console.error("[SmsCampaignWorker] recipient send failed", {
            campaignId: job.campaignId,
            jobId: job.jobId,
            runId: context.runId,
            legacyId: recipient.legacyId,
            error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
          });
        }

        const processedRecipients = acceptedRecipients + rejectedRecipients;
        const progress = job.totalRecipients > 0
          ? Math.round((processedRecipients / job.totalRecipients) * 100)
          : 100;

        await this.app.container.smsCampaignQueue.publishProgress(job.jobId, {
          status: "running",
          processed: processedRecipients,
          sent: acceptedRecipients,
          failed: rejectedRecipients,
          percent: progress
        });

        if (context.signal.aborted) {
          interrupted = true;
          interruptionReason = context.signal.reason instanceof Error ? context.signal.reason.message : "Operação de SMS cancelada.";
          break;
        }

        const isLastRecipient = globalIndex >= job.recipients.length - 1;
        const isLastInBatch = index >= batch.length - 1;
        if (!isLastRecipient && !isLastInBatch) {
          const nextDispatchAt = new Date(Date.now() + intervalMs).toISOString();
          console.info("[SmsCampaignWorker] waiting before next recipient", {
            campaignId: job.campaignId,
            jobId: job.jobId,
            runId: context.runId,
            nextRecipientIndex: globalIndex + 1,
            delayMs: intervalMs,
            nextDispatchAt,
            processedRecipients,
            acceptedRecipients,
            rejectedRecipients
          });
          try {
            await delay(intervalMs, context.signal);
          } catch (error) {
            interrupted = true;
            interruptionReason = error instanceof Error ? error.message : String(error);
            break;
          }
        }
      }

      await this.app.container.smsCampaignQueue.publishProgress(job.jobId, {
        status: "running",
        processed: acceptedRecipients + rejectedRecipients,
        sent: acceptedRecipients,
        failed: rejectedRecipients,
        percent: job.totalRecipients > 0
          ? Math.round(((acceptedRecipients + rejectedRecipients) / job.totalRecipients) * 100)
          : 100
      }, { force: true });

      if (interrupted) break;
    }

    if (interrupted && interruptionReason) {
      const remainingRecipients = job.recipients.slice(acceptedRecipients + rejectedRecipients);
      const now = new Date().toISOString();

      for (const recipient of remainingRecipients) {
        await this.app.container.repositories.campaignRecipients.upsert({
          campaignId: job.campaignId,
          legacyId: recipient.legacyId,
          email: recipient.email ?? "",
          phone: recipient.phoneE164 ?? recipient.phoneRaw ?? null,
          recipientName: recipient.recipientName ?? null,
          status: "failed",
          messageId: null,
          errorReason: interruptionReason,
          sentAt: now
        });
      }

      await this.app.container.repositories.campaigns.update({
        ...campaign,
        status: "failed",
        providerMessageId: lastMessageId ?? campaign.providerMessageId ?? null,
        sentAt: acceptedRecipients > 0 ? now : null
      } as unknown as Campaign);

      await this.app.container.smsCampaignQueue.publishProgress(job.jobId, {
        status: "cancelled",
        processed: acceptedRecipients + rejectedRecipients + remainingRecipients.length,
        sent: acceptedRecipients,
        failed: rejectedRecipients + remainingRecipients.length,
        percent: 100,
        errorReason: interruptionReason
      }, { force: true });

      throw new SmsDispatchError(interruptionReason, {
        campaignId: job.campaignId,
        accepted: acceptedRecipients,
        rejected: rejectedRecipients + remainingRecipients.length
      });
    }

    const allRecipients = await this.app.container.repositories.campaignRecipients.findByCampaign(job.campaignId);
    const sentRecipients = allRecipients.filter((recipient) => recipient.status === "sent");
    const pendingRecipients = allRecipients.filter((recipient) => recipient.status === "pending");
    const failedRecipients = allRecipients.filter((recipient) => recipient.status === "failed");
    const now = new Date().toISOString();

    if (pendingRecipients.length > 0) {
      for (const recipient of pendingRecipients) {
        await this.app.container.repositories.campaignRecipients.upsert({
          ...recipient,
          status: "failed",
          messageId: recipient.messageId ?? null,
          errorReason: recipient.errorReason ?? "Envio interrompido antes da conclusão.",
          sentAt: recipient.sentAt
        });
      }
    }

    await this.app.container.repositories.campaigns.update({
      ...campaign,
      status: failedRecipients.length === 0 && pendingRecipients.length === 0 ? "sent" : "failed",
      providerMessageId: lastMessageId ?? campaign.providerMessageId ?? null,
      sentAt: failedRecipients.length === 0 && pendingRecipients.length === 0 ? now : (sentRecipients.length > 0 ? now : null)
    } as unknown as Campaign);

    console.info("[SmsCampaignWorker] campaign finalized", {
      campaignId: job.campaignId,
      jobId: job.jobId,
      runId: context.runId,
      acceptedRecipients: sentRecipients.length,
      rejectedRecipients: failedRecipients.length + pendingRecipients.length,
      providerMessageId: lastMessageId
    });

    await this.app.container.smsCampaignQueue.publishProgress(job.jobId, {
      status: failedRecipients.length === 0 && pendingRecipients.length === 0 ? "completed" : "failed",
      processed: sentRecipients.length + failedRecipients.length + pendingRecipients.length,
      sent: sentRecipients.length,
      failed: failedRecipients.length + pendingRecipients.length,
      percent: 100,
      finishedAt: now,
      errorReason: failedRecipients.length > 0 || pendingRecipients.length > 0
        ? "Alguns SMS falharam durante o envio."
        : null
    }, { force: true });

    if (failedRecipients.length > 0 || pendingRecipients.length > 0) {
      throw new SmsDispatchError("Alguns SMS falharam durante o envio.", {
        campaignId: job.campaignId,
        accepted: sentRecipients.length,
        rejected: failedRecipients.length + pendingRecipients.length
      });
    }
  }
}
