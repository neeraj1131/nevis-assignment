import { z } from 'zod';
import { CompanySchema } from './schema.js';
import { MONTHS } from './months.js';

/**
 * The shape of the `GET /api/v1/clients` response. Single source of truth
 * for both apps/api (which drives its OpenAPI schema from this) and
 * apps/web (which re-validates the HTTP response at the runtime boundary) —
 * neither app re-declares this shape locally.
 */
export const ClientsResponseSchema = z.object({
  data: CompanySchema,
  meta: z.object({
    months: z.array(z.enum(MONTHS)).length(12),
    generatedAt: z.string(),
  }),
});

export type ClientsResponse = z.infer<typeof ClientsResponseSchema>;
