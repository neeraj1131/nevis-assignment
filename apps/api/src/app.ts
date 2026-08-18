import crypto from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { loadClientsDataset } from './data.js';
import { registerErrorHandlers } from './plugins/problem-details.js';
import { registerClientsRoute } from './routes/clients.js';
import { registerHealthRoute } from './routes/health.js';

const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

function parseCorsOrigins(raw: string | undefined): string[] {
  const value = raw ?? DEFAULT_CORS_ORIGIN;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export interface BuildAppOptions {
  logger?: FastifyServerOptions['logger'];
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL ?? 'info';

  const app = Fastify({
    logger: opts.logger ?? {
      level: logLevel,
      transport: isProduction ? undefined : { target: 'pino-pretty' },
    },
    genReqId: () => crypto.randomUUID(),
    disableRequestLogging: false,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  void app.register(helmet, { contentSecurityPolicy: false });
  void app.register(cors, {
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    methods: ['GET'],
  });

  registerErrorHandlers(app);
  registerHealthRoute(app);

  // Fail fast: an invalid dataset should crash startup rather than serve
  // corrupt data.
  const company = loadClientsDataset(app.log);
  const generatedAt = new Date().toISOString();
  registerClientsRoute(app, { company, generatedAt });

  return app;
}
