import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AmazonSnsSmsAdapter } from "../src/services/sms/amazon-sns-sms.adapter.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function findWorkspaceRoot(startDir: string) {
  let current = resolve(startDir);

  while (current !== dirname(current)) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) return current;
    current = dirname(current);
  }

  throw new Error("Nao foi possivel localizar a raiz do workspace.");
}

function loadDotEnv(filePath: string) {
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

function requireArg(name: string) {
  const prefix = `--${name}=`;
  const fromArgv = process.argv.find((arg) => arg.startsWith(prefix));
  const fromEnv = process.env[name.toUpperCase()];
  const value = (fromArgv ? fromArgv.slice(prefix.length) : fromEnv)?.trim();

  if (!value) {
    throw new Error(`Argumento obrigatorio ausente: --${name}`);
  }

  return value;
}

const workspaceRoot = findWorkspaceRoot(scriptDir);
loadDotEnv(join(workspaceRoot, ".env"));

const phone = requireArg("phone");
const message = requireArg("message");
const campaignId = `sms_test_${Date.now()}`;

console.log("Enviando SMS de teste via Amazon SNS...");
console.log(`Regiao: ${process.env.AWS_REGION ?? "(nao definida)"}`);
console.log(`Telefone: ${phone}`);
console.log(`Mensagem: ${message}`);

const adapter = new AmazonSnsSmsAdapter();

try {
  const result = await adapter.sendOne({
    campaignId,
    message,
    phoneNumber: phone
  });

  console.log("SMS enviado com sucesso.");
  console.log(`MessageId: ${result.providerMessageId}`);
} catch (error) {
  console.error("Falha ao enviar SMS.");
  console.error(`Nome: ${error instanceof Error ? error.name : "UnknownError"}`);
  console.error(`Mensagem: ${error instanceof Error ? error.message : String(error)}`);

  if (error instanceof Error && "details" in error) {
    console.error("Detalhes:", (error as { details?: unknown }).details);
  }

  process.exitCode = 1;
}
