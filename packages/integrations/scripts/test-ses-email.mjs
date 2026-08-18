import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function findWorkspaceRoot(startDir) {
  let current = resolve(startDir);

  while (current !== dirname(current)) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) return current;
    current = dirname(current);
  }

  throw new Error("Nao foi possivel localizar a raiz do workspace.");
}

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${name}`);
  if (value.startsWith("SUA_")) throw new Error(`Variavel ${name} ainda parece ser placeholder.`);
  return value;
}

function parseRecipients(value) {
  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

const workspaceRoot = findWorkspaceRoot(scriptDir);
loadDotEnv(join(workspaceRoot, ".env"));

const region = requireEnv("AWS_REGION");
const fromEmail = requireEnv("SES_FROM_EMAIL");
const toEmails = parseRecipients(requireEnv("SES_TO_EMAIL"));

if (toEmails.length === 0) {
  throw new Error("SES_TO_EMAIL nao possui destinatarios validos.");
}

if (toEmails.length > 50) {
  throw new Error("SES SendEmail aceita no maximo 50 destinatarios por chamada.");
}

const client = new SESClient({ region });
const sentAt = new Date().toISOString();

const command = new SendEmailCommand({
  Source: fromEmail,
  Destination: {
    ToAddresses: toEmails
  },
  Message: {
    Subject: {
      Charset: "UTF-8",
      Data: "Teste Amazon SES - Reciclotron"
    },
    Body: {
      Html: {
        Charset: "UTF-8",
        Data: `
          <h1>Teste Amazon SES</h1>
          <p>Este email foi enviado pelo script de teste do backend Reciclotron.</p>
          <p><strong>Data UTC:</strong> ${sentAt}</p>
        `
      },
      Text: {
        Charset: "UTF-8",
        Data: `Teste Amazon SES - Reciclotron\n\nEste email foi enviado pelo script de teste.\nData UTC: ${sentAt}`
      }
    }
  }
});

console.log("Enviando email de teste via Amazon SES...");
console.log(`Regiao: ${region}`);
console.log(`Remetente: ${fromEmail}`);
console.log(`Destinatarios: ${toEmails.join(", ")}`);

try {
  const response = await client.send(command);

  console.log("Email aceito pelo SES.");
  console.log(`MessageId: ${response.MessageId}`);
} catch (error) {
  console.error("Falha ao enviar email via SES.");
  console.error(`Nome: ${error.name ?? "UnknownError"}`);
  console.error(`Mensagem: ${error.message ?? String(error)}`);

  if (error.name === "MessageRejected") {
    console.error("Verifique se o remetente esta verificado e se a conta saiu do sandbox.");
  }

  if (error.name === "InvalidClientTokenId" || error.name === "SignatureDoesNotMatch") {
    console.error("Verifique AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_REGION.");
  }

  process.exitCode = 1;
}
