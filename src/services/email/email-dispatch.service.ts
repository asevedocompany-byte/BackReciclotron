import type { FastifyInstance } from "fastify";
import type { Campaign } from "@reciclotron/contracts";
import { AppError } from "../../shared/errors/app-error.js";
import { AmazonSesEmailAdapter } from "./email-ses.adapter.js";

export type RecipientInput = {
  legacyId: number;
  email: string;
};

type EmailDispatchResult = {
  providerMessageId: string;
  accepted: number;
  rejected: number;
};

function extractEmail(value: string | null | undefined) {
  const email = value?.trim();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error ? signal.reason : new Error("Operação cancelada por timeout.");
}

export class EmailDispatchService {
  private readonly sesAdapter = new AmazonSesEmailAdapter();
  private readonly maxAttempts = 3;
  private readonly baseRetryDelayMs = 250;
  private readonly minSesAttemptIntervalMs = 100;
  private lastSesAttemptAt = 0;

  constructor(private readonly app: FastifyInstance) {}

  async send(campaign: Campaign, recipients: RecipientInput[], signal?: AbortSignal): Promise<EmailDispatchResult> {
    console.info("[SES][EmailDispatchService] send called", {
      campaignId: campaign.id,
      recipientsCount: recipients.length
    });
    const emails = recipients.map((recipient) => extractEmail(recipient.email)).filter((email): email is string => Boolean(email));

    if (emails.length === 0) {
      throw new AppError(400, "Nenhum destinatario valido encontrado para a campanha.");
    }

    let accepted = 0;
    let rejected = 0;
    let providerMessageId = "";

    for (const recipient of emails) {
      try {
        const response = await this.sendWithRetry({
          campaignId: campaign.id,
          recipient,
          subject: campaign.subject,
          message: campaign.message,
          attachments: campaign.attachments ?? [],
          signal
        });

        accepted += 1;
        providerMessageId ||= response.messageId;
        console.info("[SES][EmailDispatchService] SES accepted", {
          campaignId: campaign.id,
          recipient,
          messageId: response.messageId
        });
      } catch (error) {
        rejected += 1;
        console.error("[SES][EmailDispatchService] SES rejected", {
          campaignId: campaign.id,
          recipient,
          error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
        });
      }
    }

    if (rejected > 0) {
      throw new AppError(502, "SES rejeitou parte do disparo da campanha.", {
        campaignId: campaign.id,
        accepted,
        rejected,
        providerMessageId: providerMessageId || null
      });
    }

    console.info("[SES][EmailDispatchService] send completed", {
      campaignId: campaign.id,
      providerMessageId,
      accepted,
      rejected
    });
    return {
      providerMessageId,
      accepted,
      rejected
    };
  }

  private async sendWithRetry(input: {
    campaignId: string;
    recipient: string;
    subject?: string;
    message: string;
    attachments?: string[];
    signal?: AbortSignal;
  }): Promise<{ messageId: string }> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      throwIfAborted(input.signal);
    console.info("[SES][EmailDispatchService] sending via SES", {
        campaignId: input.campaignId,
        recipient: input.recipient,
        subject: input.subject ?? null,
        messageLength: input.message.length,
        attempt,
        maxAttempts: this.maxAttempts
      });

      try {
        await this.waitForSesRateLimit(input.signal);
        return await this.sesAdapter.sendEmail({
          recipient: input.recipient,
          subject: input.subject,
          message: input.message,
          attachments: input.attachments ?? [],
          campaignId: input.campaignId,
          signal: input.signal
        });
      } catch (error) {
        lastError = error;
        const errorSummary = error instanceof Error ? { name: error.name, message: error.message } : String(error);
        console.error("[SES][EmailDispatchService] SES attempt failed", {
          campaignId: input.campaignId,
          recipient: input.recipient,
          attempt,
          maxAttempts: this.maxAttempts,
          error: errorSummary
        });

        if (attempt < this.maxAttempts) {
          const delayMs = this.baseRetryDelayMs * (2 ** (attempt - 1));
          console.info("[SES][EmailDispatchService] retrying SES send", {
            campaignId: input.campaignId,
            recipient: input.recipient,
            nextAttempt: attempt + 1,
            delayMs
          });
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              if (input.signal) {
                input.signal.removeEventListener("abort", onAbort);
              }
              resolve();
            }, delayMs);

            const onAbort = () => {
              clearTimeout(timer);
              reject(input.signal?.reason ?? new Error("Operação cancelada por timeout."));
            };

            if (input.signal) {
              if (input.signal.aborted) {
                clearTimeout(timer);
                reject(input.signal.reason ?? new Error("Operação cancelada por timeout."));
                return;
              }
              input.signal.addEventListener("abort", onAbort, { once: true });
            }
          });
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError ?? "Falha ao enviar email via SES."));
  }

  private async waitForSesRateLimit(signal?: AbortSignal) {
    const elapsedMs = Date.now() - this.lastSesAttemptAt;
    const delayMs = Math.max(0, this.minSesAttemptIntervalMs - elapsedMs);

    if (delayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, delayMs);
        const onAbort = () => {
          clearTimeout(timer);
          reject(signal?.reason ?? new Error("Operação cancelada por timeout."));
        };

        if (signal) {
          if (signal.aborted) {
            onAbort();
            return;
          }
          signal.addEventListener("abort", onAbort, { once: true });
        }
      });
    }

    throwIfAborted(signal);
    this.lastSesAttemptAt = Date.now();
  }
}
