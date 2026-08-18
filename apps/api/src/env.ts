import { z } from 'zod';

const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

/**
 * Validated process environment. Mirrors the defaults previously scattered
 * across server.ts/app.ts so behavior is unchanged; the difference is that
 * an invalid value (e.g. a non-numeric PORT) now fails fast at startup with
 * a readable message instead of silently coercing to NaN or an unexpected
 * runtime value.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().min(1).default(DEFAULT_CORS_ORIGIN),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Parses and validates `process.env` once at startup. Throws with a
 * human-readable message (via zod's flatten) on failure so misconfiguration
 * is caught before the server starts accepting traffic.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);

  if (!result.success) {
    const issues = z.flattenError(result.error).fieldErrors;
    const message = Object.entries(issues)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return result.data;
}
