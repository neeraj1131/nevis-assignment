import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CompanySchema, MONTHS, type Company } from '@nevis/shared';

const ClientsResponseSchema = z.object({
  data: CompanySchema,
  meta: z.object({
    months: z.array(z.enum(MONTHS)).length(12),
    generatedAt: z.string(),
  }),
});

// 304 replies never carry a body (see the `reply.send()` call below), so this
// schema exists only to let `reply.status(304)` type-check.
const NotModifiedResponseSchema = z.undefined();

export interface ClientsRouteOptions {
  company: Company;
  generatedAt: string;
}

const CACHE_CONTROL = 'public, max-age=300';

export function registerClientsRoute(app: FastifyInstance, options: ClientsRouteOptions): void {
  // The dataset and generatedAt are fixed for the lifetime of this app
  // instance, so the response body (and its ETag) are computed once here
  // rather than on every request.
  const body = {
    data: options.company,
    meta: {
      months: MONTHS,
      generatedAt: options.generatedAt,
    },
  };
  const serializedBody = JSON.stringify(body);
  const etag = `"${createHash('sha256').update(serializedBody).digest('hex')}"`;

  app.get(
    '/api/v1/clients',
    { schema: { response: { 200: ClientsResponseSchema, 304: NotModifiedResponseSchema } } },
    async (request, reply) => {
      reply.header('etag', etag);
      reply.header('cache-control', CACHE_CONTROL);

      if (request.headers['if-none-match'] === etag) {
        reply.status(304);
        reply.send();
        return;
      }

      reply.header('content-type', 'application/json; charset=utf-8');
      // Send the precomputed string directly (bypassing the schema
      // serializer) so the bytes on the wire always match the ETag above.
      reply.send(serializedBody);
    },
  );
}
