import { join } from "path";

try {
  (process as any).loadEnvFile(join(process.cwd(), ".env"));
  console.log("[server] .env carregado via process.loadEnvFile");
} catch (err) {
  console.warn("[server] Não foi possível carregar o .env nativamente, usando variáveis do shell");
}

import { getConfig } from "@reciclotron/config";
import { buildApp } from "./app.js";

const start = async () => {
  const app = await buildApp();
  const config = getConfig();
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
};
start();
