import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { getConfig } from "@reciclotron/config";
import containerPlugin from "./plugins/container.js";
import authPlugin from "./plugins/auth.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import { registerRoutes } from "./routes/index.js";
import { AppError } from "./shared/errors/app-error.js";
import { createLegacyPool, closeLegacyPool } from "./legacy-db/index.js";
function summarizeError(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message
        };
    }
    return {
        name: "UnknownError",
        message: String(error)
    };
}
export async function buildApp() {
    const config = getConfig();
    const app = Fastify({ logger: false, trustProxy: true });
    // Inicializa conexão com o banco legado (MySQL KingHost)
    // Requer: LEGACY_DB_HOST, LEGACY_DB_NAME, LEGACY_DB_USER, LEGACY_DB_PASSWORD no .env
    createLegacyPool();
    app.addHook("onClose", async () => {
        await closeLegacyPool();
    });
    const corsOrigins = config.CORS_ORIGIN
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    await app.register(cors, {
        origin: corsOrigins.includes('*')
            ? true
            : corsOrigins.length > 1
                ? corsOrigins
                : corsOrigins[0] ?? true,
        credentials: true
    });
    await app.register(sensible);
    await app.register(rateLimitPlugin);
    await app.register(containerPlugin);
    await app.register(authPlugin);
    await registerRoutes(app);
    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(error.details === undefined
                ? { message: error.message }
                : { message: error.message, details: error.details });
        }
        if (error.issues)
            return reply.status(400).send({ message: 'Payload inválido', issues: error.issues });
        console.error("[App] Erro interno não tratado:", summarizeError(error));
        return reply.status(500).send({ message: 'Erro interno do servidor' });
    });
    return app;
}
//# sourceMappingURL=app.js.map