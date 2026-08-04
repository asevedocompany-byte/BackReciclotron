import { AppError } from "../../shared/errors/app-error.js";
import { AmazonSesEmailAdapter } from "./email-ses.adapter.js";
function extractEmail(value) {
    const email = value?.trim();
    if (!email)
        return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
function throwIfAborted(signal) {
    if (!signal?.aborted)
        return;
    throw signal.reason instanceof Error ? signal.reason : new Error("Operação cancelada por timeout.");
}
export class EmailDispatchService {
    app;
    sesAdapter = new AmazonSesEmailAdapter();
    maxAttempts = 3;
    baseRetryDelayMs = 250;
    minSesAttemptIntervalMs = 100;
    lastSesAttemptAt = 0;
    constructor(app) {
        this.app = app;
    }
    async send(campaign, recipients, signal) {
        console.info("[EmailDispatchService] send called", {
            campaignId: campaign.id,
            recipientsCount: recipients.length
        });
        const emails = recipients.map((recipient) => extractEmail(recipient.email)).filter((email) => Boolean(email));
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
                console.info("[EmailDispatchService] SES accepted", {
                    campaignId: campaign.id,
                    recipient,
                    messageId: response.messageId
                });
            }
            catch (error) {
                rejected += 1;
                console.error("[EmailDispatchService] SES rejected", {
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
        console.info("[EmailDispatchService] send completed", {
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
    async sendWithRetry(input) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
            throwIfAborted(input.signal);
            console.info("[EmailDispatchService] sending via SES", {
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
            }
            catch (error) {
                lastError = error;
                const errorSummary = error instanceof Error ? { name: error.name, message: error.message } : String(error);
                console.error("[EmailDispatchService] SES attempt failed", {
                    campaignId: input.campaignId,
                    recipient: input.recipient,
                    attempt,
                    maxAttempts: this.maxAttempts,
                    error: errorSummary
                });
                if (attempt < this.maxAttempts) {
                    const delayMs = this.baseRetryDelayMs * (2 ** (attempt - 1));
                    console.info("[EmailDispatchService] retrying SES send", {
                        campaignId: input.campaignId,
                        recipient: input.recipient,
                        nextAttempt: attempt + 1,
                        delayMs
                    });
                    await new Promise((resolve, reject) => {
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
    async waitForSesRateLimit(signal) {
        const elapsedMs = Date.now() - this.lastSesAttemptAt;
        const delayMs = Math.max(0, this.minSesAttemptIntervalMs - elapsedMs);
        if (delayMs > 0) {
            await new Promise((resolve, reject) => {
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
//# sourceMappingURL=email-dispatch.service.js.map