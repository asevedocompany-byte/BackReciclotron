import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getConfig } from "@reciclotron/config";

type SendSesEmailInput = {
  recipient: string;
  subject?: string;
  message: string;
  campaignId?: string;
};

type SendSesEmailResult = {
  messageId: string;
};

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function createClient() {
  const config = getConfig();
  const accessKeyId = config.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = config.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  return new SESClient({
    region: config.AWS_REGION,
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined
  });
}

export class AmazonSesEmailAdapter {
  private readonly client = createClient();
  private readonly config = getConfig();

  async sendEmail(input: SendSesEmailInput): Promise<SendSesEmailResult> {
    if (!this.config.SES_FROM_EMAIL) throw new Error("SES_FROM_EMAIL nao configurado.");

    console.info("[AmazonSesEmailAdapter] sendEmail called", {
      recipient: input.recipient,
      campaignId: input.campaignId ?? null,
      region: this.config.AWS_REGION,
      fromEmail: this.config.SES_FROM_EMAIL,
      replyToEmail: this.config.SES_REPLY_TO_EMAIL ?? null,
      configurationSet: this.config.SES_CONFIGURATION_SET ?? null,
      subject: input.subject?.trim() || "Reciclotron",
      messageLength: input.message.length
    });

    const command = new SendEmailCommand({
      Source: this.config.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [input.recipient]
      },
      ReplyToAddresses: this.config.SES_REPLY_TO_EMAIL ? [this.config.SES_REPLY_TO_EMAIL] : undefined,
      ConfigurationSetName: this.config.SES_CONFIGURATION_SET,
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: input.subject?.trim() || "Reciclotron"
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: input.message
          },
          Text: {
            Charset: "UTF-8",
            Data: stripHtml(input.message)
          }
        }
      },
      Tags: input.campaignId
        ? [
            { Name: "campaign_id", Value: input.campaignId },
            { Name: "channel", Value: "email" }
          ]
        : undefined
    });

    console.info("[AmazonSesEmailAdapter] SES command prepared", {
      recipient: input.recipient,
      hasConfigurationSet: Boolean(this.config.SES_CONFIGURATION_SET),
      hasReplyTo: Boolean(this.config.SES_REPLY_TO_EMAIL),
      hasCampaignTags: Boolean(input.campaignId)
    });

    const response = await this.client.send(command);

    console.info("[AmazonSesEmailAdapter] SES response received", {
      recipient: input.recipient,
      messageId: response.MessageId ?? null,
      requestId: response.$metadata?.requestId ?? null,
      httpStatusCode: response.$metadata?.httpStatusCode ?? null
    });

    if (!response.MessageId) throw new Error("SES nao retornou MessageId.");
    return { messageId: response.MessageId };
  }
}
