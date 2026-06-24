import { getConfig } from "@reciclotron/config";
import { AppError } from "../shared/errors/app-error.js";
import { AmazonSesEmailAdapter } from "./email-ses.adapter.js";
function extractEmail(value) {
    const email = value?.trim();
    if (!email)
        return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export class EmailDispatchService {
    app;
    sesAdapter = new AmazonSesEmailAdapter();
    constructor(app) {
        this.app = app;
    }
    async send(campaign, recipients) {
        console.info("[EmailDispatchService] send called", {
            campaignId: campaign.id,
            recipientsCount: recipients.length
        });
        const config = getConfig();
        const emails = recipients.map((recipient) => extractEmail(recipient.email)).filter((email) => Boolean(email));
        if (emails.length === 0) {
            throw new AppError(400, "Nenhum destinatario valido encontrado para a campanha.");
        }
        if (config.EMAIL_PROVIDER !== "ses") {
            console.info("[EmailDispatchService] using mock email provider", {
                campaignId: campaign.id,
                recipientsCount: emails.length
            });
            const response = await this.app.container.providers.email.sendCampaign({
                subject: campaign.subject,
                message: campaign.message,
                recipients: emails
            });
            return {
                providerMessageId: response.providerMessageId,
                accepted: response.accepted,
                rejected: Math.max(0, emails.length - response.accepted)
            };
        }
        let accepted = 0;
        let rejected = 0;
        let providerMessageId = "";
        for (const recipient of emails) {
            console.info("[EmailDispatchService] sending via SES", { campaignId: campaign.id, recipient });
            try {
                const response = await this.sesAdapter.sendEmail({
                    recipient,
                    subject: campaign.subject,
                    message: campaign.message,
                    campaignId: campaign.id
                });
                accepted += 1;
                providerMessageId ||= response.messageId;
            }
            catch {
                rejected += 1;
            }
        }
        if (accepted === 0) {
            throw new AppError(502, "SES nao aceitou nenhum destinatario da campanha.");
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
}
//# sourceMappingURL=email-dispatch.service.js.map