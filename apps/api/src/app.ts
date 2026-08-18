import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { loadClientsDataset } from './data.js';
import { type Env, loadEnv } from './env.js';
import { registerErrorHandlers } from './plugins/problem-details.js';
import { registerClientsRoute } from './routes/clients.js';
import { registerHealthRoute } from './routes/health.js';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Thrown by the rate-limit plugin's `errorResponseBuilder` below. Shaping it
 * as a `FastifyError` (statusCode + code + a human name) lets the shared
 * error handler in plugins/problem-details.ts turn it into the same RFC 9457
 * problem-details body every other 4xx/5xx response uses, instead of
 * @fastify/rate-limit's default `{ statusCode, error, message }` shape.
 */
class RateLimitExceededError extends Error {
  statusCode = 429;
  code = 'FST_ERR_RATE_LIMIT';

  constructor(message: string) {
    super(message);
    // `name` doubles as the problem-details "title" for non-5xx errors in
    // plugins/problem-details.ts — keep this in sync if that mapping changes.
    this.name = 'Too Many Requests';
  }
}

function readApiVersion(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const pkgPath = path.join(moduleDir, '..', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
  return pkg.version;
}

function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export interface BuildAppOptions {
  logger?: FastifyServerOptions['logger'];
  env?: Env;
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const env = opts.env ?? loadEnv();
  const isProduction = env.NODE_ENV === 'production';

  const app = Fastify({
    logger: opts.logger ?? {
      level: env.LOG_LEVEL,
      transport: isProduction ? undefined : { target: 'pino-pretty' },
    },
    // In prod (docker-compose.yml) requests arrive via the nginx container,
    // so req.ip would otherwise be nginx's container IP for every client —
    // trust the X-Forwarded-For it sets so rate-limiting (and logging) key
    // on the real client IP instead of nginx's.
    trustProxy: true,
    // Honor an incoming x-request-id so requests can be correlated across
    // services; fall back to a fresh UUID when the client didn't send one.
    genReqId: (request) => {
      const incoming = request.headers[REQUEST_ID_HEADER];
      return typeof incoming === 'string' && incoming.length > 0 ? incoming : crypto.randomUUID();
    },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Echo the (possibly client-supplied) request id back on every response
  // so callers can correlate their request with server-side logs.
  app.addHook('onSend', (request, reply, payload, done) => {
    reply.header(REQUEST_ID_HEADER, request.id);
    done(null, payload);
  });

  // M2 (deferred): CSP is off for the whole app, not just this JSON API's
  // response types — acceptable for now since this API serves no HTML/JS,
  // but revisit with a scoped policy if that ever changes.
  void app.register(helmet, { contentSecurityPolicy: false });
  void app.register(cors, {
    origin: parseCorsOrigins(env.CORS_ORIGIN),
    methods: ['GET'],
  });

  void app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    // Throwing a FastifyError-shaped object (rather than returning a plain
    // body) routes 429s through the same setErrorHandler as every other
    // error, so the response is problem-details shaped like the rest of
    // the API instead of @fastify/rate-limit's default JSON shape.
    errorResponseBuilder: (_request, context) =>
      new RateLimitExceededError(`Rate limit exceeded, retry in ${context.after}ms`),
  });

  void app.register(swagger, {
    openapi: {
      info: {
        title: 'Nevis Clients API',
        version: readApiVersion(),
      },
    },
    transform: jsonSchemaTransform,
  });
  void app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  registerErrorHandlers(app);

  // Fail fast: an invalid dataset should crash startup rather than serve
  // corrupt data.
  const company = loadClientsDataset(app.log);
  const generatedAt = new Date().toISOString();

  // Routes are registered inside a nested `register` (rather than called
  // directly on `app`) so avvio boots them *after* the plugins above have
  // run. @fastify/rate-limit and @fastify/swagger both instrument routes
  // via an `onRoute` hook they attach when their own plugin body executes;
  // calling `app.get(...)` synchronously before that would add the route
  // before those hooks exist, silently skipping rate-limiting/OpenAPI
  // documentation for it.
  void app.register((instance, _opts, done) => {
    registerHealthRoute(instance);
    registerClientsRoute(instance, { company, generatedAt });
    done();
  });

  return app;
}
