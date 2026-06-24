import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().default(3333),
    API_HOST: z.string().default("0.0.0.0"),
    JWT_SECRET: z.string().default("reciclotron-dev-secret"),
    CORS_ORIGIN: z.string().default("*"),
    ADMIN_SEED_EMAIL: z.string().email().default("admin@reciclotron.local"),
    ADMIN_SEED_PASSWORD: z.string().default("admin1234"),
    EMAIL_PROVIDER: z.enum(["mock", "ses"]).default("mock"),
    AWS_REGION: z.string().default("us-east-2"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    SES_FROM_EMAIL: z.string().email().optional(),
    SES_REPLY_TO_EMAIL: z.string().email().optional(),
    SES_CONFIGURATION_SET: z.string().optional()
});
export const getConfig = () => envSchema.parse(process.env);
//# sourceMappingURL=index.js.map