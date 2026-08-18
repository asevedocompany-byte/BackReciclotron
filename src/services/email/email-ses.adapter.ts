import { SESClient, SendRawEmailCommand, GetSendQuotaCommand } from "@aws-sdk/client-ses";
import { getConfig } from "@reciclotron/config";

type SendSesEmailInput = {
  recipient: string;
  subject?: string;
  message: string;
  attachments?: string[];
  campaignId?: string;
  signal?: AbortSignal;
};

function formatFromHeader(name: string, email: string) {
  // O nome explícito impede que clientes exibam somente a parte local do e-mail ("contato").
  const safeName = name.replace(/[\r\n]/g, "").replace(/"/g, "'").trim();
  return `${safeName} <${email}>`;
}

type SendSesEmailResult = {
  messageId: string;
};

type SerializedAttachment = {
  name: string;
  mimeType: string;
  size: number;
  originalSize: number;
  compressed: boolean;
  dataUrl?: string;
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

function chunkString(value: string, chunkSize: number) {
  const parts: string[] = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    parts.push(value.slice(index, index + chunkSize));
  }
  return parts.join("\r\n");
}

function encodeBase64Utf8(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) {
    throw new Error("Anexo inválido: dataUrl malformada.");
  }

  return {
    mimeType: match[1] || "application/octet-stream",
    buffer: Buffer.from(match[2], "base64")
  };
}

function parseAttachment(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Partial<SerializedAttachment>;
    if (!parsed || typeof parsed.name !== "string") return null;

    const name = parsed.name.trim();
    if (!name) return null;

    const dataUrl = typeof parsed.dataUrl === "string" && parsed.dataUrl.trim() ? parsed.dataUrl.trim() : null;
    if (!dataUrl) return null;

    const { mimeType, buffer } = parseDataUrl(dataUrl);
    return {
      name,
      mimeType: parsed.mimeType?.trim() || mimeType,
      buffer
    };
  } catch {
    return null;
  }
}

function buildMimeMessage(input: {
  from: string;
  replyTo?: string | null;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: string[];
}) {
  const mixedBoundary = `mixed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const altBoundary = `alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  const lines: string[] = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    `MIME-Version: 1.0`
  ];

  if (input.replyTo) {
    lines.push(`Reply-To: ${input.replyTo}`);
  }

  lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
  lines.push("");
  lines.push(`--${mixedBoundary}`);
  lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
  lines.push("");

  lines.push(`--${altBoundary}`);
  lines.push(`Content-Type: text/plain; charset="UTF-8"`);
  lines.push(`Content-Transfer-Encoding: base64`);
  lines.push("");
  lines.push(chunkString(encodeBase64Utf8(input.text), 76));
  lines.push("");

  lines.push(`--${altBoundary}`);
  lines.push(`Content-Type: text/html; charset="UTF-8"`);
  lines.push(`Content-Transfer-Encoding: base64`);
  lines.push("");
  lines.push(chunkString(encodeBase64Utf8(input.html), 76));
  lines.push("");
  lines.push(`--${altBoundary}--`);
  lines.push("");

  const attachments = input.attachments.map(parseAttachment).filter((item): item is NonNullable<ReturnType<typeof parseAttachment>> => Boolean(item));
  for (const attachment of attachments) {
    lines.push(`--${mixedBoundary}`);
    lines.push(`Content-Type: ${attachment.mimeType}; name="${attachment.name.replace(/"/g, '\\"')}"`);
    lines.push(`Content-Transfer-Encoding: base64`);
    lines.push(`Content-Disposition: attachment; filename="${attachment.name.replace(/"/g, '\\"')}"`);
    lines.push("");
    lines.push(chunkString(attachment.buffer.toString("base64"), 76));
    lines.push("");
  }

  lines.push(`--${mixedBoundary}--`);
  lines.push("");

  return lines.join("\r\n");
}

export class AmazonSesEmailAdapter {
  private readonly client = createClient();
  private readonly config = getConfig();

  async sendEmail(input: SendSesEmailInput): Promise<SendSesEmailResult> {
    if (!this.config.SES_FROM_EMAIL) throw new Error("SES_FROM_EMAIL nao configurado.");

    console.info("[SES][AmazonSesEmailAdapter] sendEmail called", {
      recipient: input.recipient,
      campaignId: input.campaignId ?? null,
      region: this.config.AWS_REGION,
      fromEmail: this.config.SES_FROM_EMAIL,
      fromName: this.config.SES_FROM_NAME,
      replyToEmail: this.config.SES_REPLY_TO_EMAIL ?? null,
      configurationSet: this.config.SES_CONFIGURATION_SET ?? null,
      subject: input.subject?.trim() || "Reciclotron",
      messageLength: input.message.length,
      attachmentsCount: input.attachments?.length ?? 0
    });

    const rawMime = buildMimeMessage({
      from: formatFromHeader(this.config.SES_FROM_NAME, this.config.SES_FROM_EMAIL),
      replyTo: this.config.SES_REPLY_TO_EMAIL ?? null,
      to: input.recipient,
      subject: input.subject?.trim() || "Reciclotron",
      html: input.message,
      text: stripHtml(input.message),
      attachments: input.attachments ?? []
    });

    const command = new SendRawEmailCommand({
      Source: this.config.SES_FROM_EMAIL,
      Destinations: [input.recipient],
      RawMessage: {
        Data: Buffer.from(rawMime, "utf8")
      },
      ConfigurationSetName: this.config.SES_CONFIGURATION_SET,
      Tags: input.campaignId
        ? [
            { Name: "campaign_id", Value: input.campaignId },
            { Name: "channel", Value: "email" }
          ]
        : undefined
    });

    console.info("[SES][AmazonSesEmailAdapter] SES raw command prepared", {
      recipient: input.recipient,
      hasConfigurationSet: Boolean(this.config.SES_CONFIGURATION_SET),
      hasReplyTo: Boolean(this.config.SES_REPLY_TO_EMAIL),
      hasCampaignTags: Boolean(input.campaignId),
      attachmentsCount: input.attachments?.length ?? 0
    });

    const response = await this.client.send(command, input.signal ? { abortSignal: input.signal } : undefined);

    console.info("[SES][AmazonSesEmailAdapter] SES response received", {
      recipient: input.recipient,
      messageId: response.MessageId ?? null,
      requestId: response.$metadata?.requestId ?? null,
      httpStatusCode: response.$metadata?.httpStatusCode ?? null
    });

    if (!response.MessageId) throw new Error("SES nao retornou MessageId.");
    return { messageId: response.MessageId };
  }

  async getSendQuota() {
    try {
      const command = new GetSendQuotaCommand({});
      const response = await this.client.send(command);
      return {
        sentLast24h: response.SentLast24Hours ?? 0,
        max24hSend: response.Max24HourSend ?? 0,
        remaining24h: Math.max(0, (response.Max24HourSend ?? 0) - (response.SentLast24Hours ?? 0)),
        maxSendRatePerSec: response.MaxSendRate ?? 0,
        isMock: false
      };
    } catch (error) {
      console.error("[SES][AmazonSesEmailAdapter] Failed to get real SES send quota:", error);
      throw error instanceof Error
        ? error
        : new Error("Não foi possível consultar a quota real do Amazon SES.");
    }
  }
}
