import crypto from "node:crypto";
import { getConfig } from "@reciclotron/config";
import { SmsDispatchError } from "./sms-errors.js";
import type { SmsCampaignDispatchJob, SmsDispatchResult } from "./sms.types.js";

type SendOneInput = {
  campaignId: string;
  message: string;
  phoneNumber: string;
};

function awsPercentEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: crypto.BinaryLike, data: string, encoding: crypto.BinaryToTextEncoding | "buffer" = "buffer") {
  const digest = crypto.createHmac("sha256", key).update(data, "utf8").digest();
  return encoding === "buffer" ? digest : digest.toString(encoding);
}

function buildSigningKey(secretAccessKey: string, dateStamp: string, region: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "sns");
  return hmac(kService, "aws4_request");
}

function formatAmzDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function parseMessageId(xml: string) {
  const match = xml.match(/<MessageId>([^<]+)<\/MessageId>/i);
  return match?.[1] ?? null;
}

function parseSnsError(xml: string) {
  const code = xml.match(/<Code>([^<]+)<\/Code>/i)?.[1];
  const message = xml.match(/<Message>([^<]+)<\/Message>/i)?.[1];
  return {
    code: code ?? "SNSPublishError",
    message: message ?? "Falha ao enviar SMS via SNS."
  };
}

export class AmazonSnsSmsAdapter {
  async send(job: SmsCampaignDispatchJob, signal?: AbortSignal): Promise<SmsDispatchResult> {
    if (job.recipients.length !== 1) {
      throw new SmsDispatchError("O adapter SNS envia apenas um destinatario por vez.", {
        campaignId: job.campaignId,
        recipientsCount: job.recipients.length
      });
    }

    const recipient = job.recipients[0];
    if (!recipient?.phoneE164) {
      throw new SmsDispatchError("Telefone invalido para envio de SMS.", {
        campaignId: job.campaignId,
        legacyId: recipient?.legacyId ?? null
      });
    }

    return this.sendOne({
      campaignId: job.campaignId,
      message: job.message,
      phoneNumber: recipient.phoneE164
    }, signal);
  }

  async sendOne(input: SendOneInput, signal?: AbortSignal): Promise<SmsDispatchResult> {
    const config = getConfig();
    const accessKeyId = config.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = config.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = config.AWS_SESSION_TOKEN ?? process.env.AWS_SESSION_TOKEN;
    const region = config.AWS_REGION;

    if (!accessKeyId || !secretAccessKey) {
      throw new SmsDispatchError("Credenciais AWS ausentes para envio de SMS.", {
        campaignId: input.campaignId
      });
    }

    const endpoint = `https://sns.${region}.amazonaws.com/`;
    const now = new Date();
    const amzDate = formatAmzDate(now);
    const dateStamp = amzDate.slice(0, 8);

    const body = [
      ["Action", "Publish"],
      ["Message", input.message],
      ["PhoneNumber", input.phoneNumber],
      ["Version", "2010-03-31"]
    ]
      .map(([key, value]) => `${awsPercentEncode(key)}=${awsPercentEncode(value)}`)
      .join("&");

    const host = `sns.${region}.amazonaws.com`;
    const canonicalHeaders = [
      `content-type:application/x-www-form-urlencoded`,
      `host:${host}`,
      `x-amz-date:${amzDate}`
    ];
    if (sessionToken) {
      canonicalHeaders.push(`x-amz-security-token:${sessionToken}`);
    }

    const signedHeaders = ["content-type", "host", "x-amz-date"];
    if (sessionToken) {
      signedHeaders.push("x-amz-security-token");
    }

    const canonicalRequest = [
      "POST",
      "/",
      "",
      `${canonicalHeaders.join("\n")}\n`,
      signedHeaders.join(";"),
      sha256Hex(body)
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/sns/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest)
    ].join("\n");

    const signingKey = buildSigningKey(secretAccessKey, dateStamp, region);
    const signature = hmac(signingKey, stringToSign, "hex");

    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders.join(";")}`,
      `Signature=${signature}`
    ].join(", ");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Host: host,
        "X-Amz-Date": amzDate,
        Authorization: authorization,
        ...(sessionToken ? { "X-Amz-Security-Token": sessionToken } : {})
      },
      body,
      signal
    });

    const text = await response.text();

    if (!response.ok) {
      const error = parseSnsError(text);
      throw new SmsDispatchError(`SNS retornou erro ${error.code}: ${error.message}`, {
        campaignId: input.campaignId,
        status: response.status,
        errorCode: error.code
      });
    }

    const messageId = parseMessageId(text);
    if (!messageId) {
      throw new SmsDispatchError("SNS nao retornou MessageId.", {
        campaignId: input.campaignId
      });
    }

    console.info("[AmazonSnsSmsAdapter] sms published", {
      campaignId: input.campaignId,
      phoneNumber: input.phoneNumber,
      region,
      messageId
    });

    return {
      providerMessageId: messageId,
      accepted: 1,
      rejected: 0
    };
  }
}
