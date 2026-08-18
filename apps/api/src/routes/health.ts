import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const HealthResponseSchema = z.object({ status: z.literal('ok') });

export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/healthz', { schema: { response: { 200: HealthResponseSchema } } }, () => ({
    status: 'ok' as const,
  }));
}
