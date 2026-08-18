import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(Number(process.env.PORT) || 3333),
  API_HOST: z.string().default("0.0.0.0"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default("*"),
  AWS_REGION: z.string().default("us-east-2"),
  AWS_SMS_REGION: z.string().default("sa-east-1"),
  AWS_ACCOUNT_ID: z.string().regex(/^\d{12}$/).optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SESSION_TOKEN: z.string().optional(),
  AWS_COST_EXPLORER_CACHE_TTL_MS: z.coerce.number().int().nonnegative().default(21_600_000),
  SMS_DISPATCH_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  SMS_DISPATCH_BATCH_SIZE: z.coerce.number().int().positive().default(10),
  SMS_COST_PER_MESSAGE_USD: z.coerce.number().positive().default(0.02297),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_TIME_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  SES_FROM_EMAIL: z.string().email().optional(),
  SES_FROM_NAME: z.string().trim().min(1).default("Reciclotron"),
  SES_REPLY_TO_EMAIL: z.string().email().optional(),
  SES_CONFIGURATION_SET: z.string().optional()
});

export type AppConfig = z.infer<typeof envSchema>;
export const getConfig = (): AppConfig => envSchema.parse(process.env);
