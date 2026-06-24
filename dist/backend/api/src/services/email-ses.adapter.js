import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getConfig } from "@reciclotron/config";
function stripHtml(input) {
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
    client = createClient();
    config = getConfig();
    async sendEmail(input) {
        if (!this.config.SES_FROM_EMAIL)
            throw new Error("SES_FROM_EMAIL nao configurado.");
        const response = await this.client.send(new SendEmailCommand({
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
        }));
        if (!response.MessageId)
            throw new Error("SES nao retornou MessageId.");
        return { messageId: response.MessageId };
    }
}
//# sourceMappingURL=email-ses.adapter.js.map