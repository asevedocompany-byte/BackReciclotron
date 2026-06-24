import type { FastifyInstance } from "fastify";
import type { Campaign } from "@reciclotron/contracts";
import { getConfig } from "@reciclotron/config";
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

export class EmailDispatchService {
  private readonly sesAdapter = new AmazonSesEmailAdapter();

  constructor(private readonly app: FastifyInstance) {}

  async send(campaign: Campaign, recipients: RecipientInput[]): Promise<EmailDispatchResult> {
    console.info("[EmailDispatchService] send called", {
      campaignId: campaign.id,
      recipientsCount: recipients.length
    });
    const config = getConfig();
    const hasSesCredentials = Boolean(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY);
    const shouldUseSes = Boolean(config.SES_FROM_EMAIL && hasSesCredentials);
    console.info("[EmailDispatchService] provider resolved", {
      campaignId: campaign.id,
      emailProvider: config.EMAIL_PROVIDER,
      shouldUseSes,
      awsRegion: config.AWS_REGION,
      hasAwsCredentials: hasSesCredentials,
      fromEmail: config.SES_FROM_EMAIL ?? null,
      replyToEmail: config.SES_REPLY_TO_EMAIL ?? null,
      configurationSet: config.SES_CONFIGURATION_SET ?? null
    });
    const emails = recipients.map((recipient) => extractEmail(recipient.email)).filter((email): email is string => Boolean(email));

    if (emails.length === 0) {
      throw new AppError(400, "Nenhum destinatario valido encontrado para a campanha.");
    }

    if (!shouldUseSes) {
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
      console.info("[EmailDispatchService] sending via SES", {
        campaignId: campaign.id,
        recipient,
        subject: campaign.subject ?? null,
        messageLength: campaign.message.length
      });
      try {
        const response = await this.sesAdapter.sendEmail({
          recipient,
          subject: campaign.subject,
          message: campaign.message,
          campaignId: campaign.id
        });

        accepted += 1;
        providerMessageId ||= response.messageId;
        console.info("[EmailDispatchService] SES accepted", {
          campaignId: campaign.id,
          recipient,
          messageId: response.messageId
        });
      } catch (error) {
        rejected += 1;
        console.error("[EmailDispatchService] SES rejected", {
          campaignId: campaign.id,
          recipient,
          error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
        });
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
