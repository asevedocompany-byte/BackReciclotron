import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().default(3333),
    API_HOST: z.string().default("0.0.0.0"),
    JWT_SECRET: z.string().default("reciclotron-dev-secret"),
    CORS_ORIGIN: z.string().default("*"),
    ADMIN_SEED_EMAIL: z.string().email().default("admin@reciclotron.local"),
    ADMIN_SEED_PASSWORD: z.string().default("admin1234"),
    AWS_REGION: z.string().default("us-east-2"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_SESSION_TOKEN: z.string().optional(),
    SMS_DISPATCH_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
    SMS_DISPATCH_BATCH_SIZE: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
    RATE_LIMIT_TIME_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_LOGIN_TIME_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    SES_FROM_EMAIL: z.string().email().optional(),
    SES_REPLY_TO_EMAIL: z.string().email().optional(),
    SES_CONFIGURATION_SET: z.string().optional()
});
export const getConfig = () => envSchema.parse(process.env);
//# sourceMappingURL=index.js.map