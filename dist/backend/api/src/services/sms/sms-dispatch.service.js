import { SmsDispatchError } from "./sms-errors.js";
import { AmazonSnsSmsAdapter } from "./amazon-sns-sms.adapter.js";
export class SmsDispatchService {
    app;
    adapter = new AmazonSnsSmsAdapter();
    constructor(app) {
        this.app = app;
    }
    async send(job, signal) {
        console.info("[SmsDispatchService] send called", {
            campaignId: job.campaignId,
            messageLength: job.message.length,
            totalRecipients: job.totalRecipients,
            validRecipients: job.recipients.filter((recipient) => recipient.isValid).length,
            invalidRecipients: job.recipients.filter((recipient) => !recipient.isValid).length
        });
        if (job.recipients.length !== 1) {
            throw new SmsDispatchError("O dispatcher SMS agora processa um destinatario por vez.", {
                campaignId: job.campaignId,
                recipientsCount: job.recipients.length
            });
        }
        const recipient = job.recipients[0];
        if (!recipient || !recipient.isValid || !recipient.phoneE164) {
            throw new SmsDispatchError("Nenhum destinatario valido encontrado para a campanha SMS.", {
                campaignId: job.campaignId
            });
        }
        console.info("[SmsDispatchService] payload ready for provider", {
            campaignId: job.campaignId,
            recipient: {
                legacyId: recipient.legacyId,
                phoneE164: recipient.phoneE164,
                phoneRaw: recipient.phoneRaw,
                isValid: recipient.isValid
            }
        });
        if (signal?.aborted) {
            throw signal.reason instanceof Error ? signal.reason : new Error("Operação de SMS cancelada.");
        }
        return this.adapter.sendOne({
            campaignId: job.campaignId,
            message: job.message,
            phoneNumber: recipient.phoneE164
        }, signal);
    }
    async preview(job) {
        console.info("[SmsDispatchService] preview called", {
            campaignId: job.campaignId,
            messageLength: job.message.length,
            recipientsCount: job.recipients.length
        });
        if (job.recipients.length === 0) {
            throw new SmsDispatchError("Nenhum destinatario valido encontrado para a campanha SMS.", {
                campaignId: job.campaignId
            });
        }
        const payload = {
            campaignId: job.campaignId,
            message: job.message,
            recipients: job.recipients,
            totalRecipients: job.totalRecipients
        };
        console.info("[SmsDispatchService] dispatch service called", {
            campaignId: job.campaignId,
            totalRecipients: job.totalRecipients,
            acceptedRecipients: job.recipients.filter((item) => item.isValid).length,
            rejectedRecipients: job.recipients.filter((item) => !item.isValid).length
        });
        console.info("[SmsDispatchService] preview payload ready", {
            campaignId: job.campaignId,
            payloadRecipientsCount: payload.recipients.length,
            validRecipientsCount: payload.recipients.filter((item) => item.isValid).length,
            sample: payload.recipients.slice(0, 5).map((recipient) => ({
                legacyId: recipient.legacyId,
                phoneE164: recipient.phoneE164,
                isValid: recipient.isValid
            }))
        });
        return payload;
    }
}
//# sourceMappingURL=sms-dispatch.service.js.map