import { z } from 'zod';
import { loadEnvFiles } from './env.loader';

loadEnvFiles();

const envSchema = z.object({
  // Server
  BASE_URL: z.string(),
  DASHBOARD_URL: z.string().optional(),
  PORT: z.string().transform(Number).default(3000),
  NODE_ENV: z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(z.enum(['development', 'production']))
    .default('development'),
  LOG_LEVEL: z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(z.enum(['debug', 'info', 'warn', 'error']))
    .default('info'),

  // Auth
  AUTH_SECRET: z.string(),

  // Database
  DATABASE_URL: z.string().optional(),

  // Storage
  STORAGE_PATH_PREFIX: z.string().default('units'),
  STORAGE_URL_SECRET: z.string().default('storage-secret'),

  // Encryption
  ENCRYPTION_SECRET: z.string(),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:4200')
    .transform((origins) => origins.split(',').map((o) => o.trim()))
    .refine(
      (originList) => {
        for (const origin of originList) {
          if (origin === '*') {
            return false;
          }

          try {
            new URL(origin);
          } catch (e) {
            return false;
          }
        }

        return true;
      },
      {
        message:
          'CORS_ORIGINS must be a comma-separated list of valid URLs. Wildcard (*) is not allowed.',
      }
    ),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const createConfig = (env: Env) =>
  ({
    auth: {
      secret: env.AUTH_SECRET,
    },
    database: {
      url: env.DATABASE_URL,
    },
    encryption: {
      secret: env.ENCRYPTION_SECRET,
    },
    server: {
      baseUrl: env.BASE_URL,
      corsOrigins: env.CORS_ORIGINS,
      dashboardUrl: env.DASHBOARD_URL ?? env.BASE_URL,
      logLevel: env.LOG_LEVEL,
      nodeEnv: env.NODE_ENV,
      origin: new URL(env.BASE_URL).origin,
      port: env.PORT,
    },
    storage: {
      pathPrefix: env.STORAGE_PATH_PREFIX,
      storageUrlSecret: env.STORAGE_URL_SECRET,
    },
  } as const);

export type Config = ReturnType<typeof createConfig>;
