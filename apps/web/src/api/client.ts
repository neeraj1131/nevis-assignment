import { z } from 'zod';
import { CompanySchema, MONTHS } from '@nevis/shared';

export const ClientsResponseSchema = z.object({
  data: CompanySchema,
  meta: z.object({
    months: z.array(z.enum(MONTHS)).length(12),
    generatedAt: z.string(),
  }),
});

export type ClientsResponse = z.infer<typeof ClientsResponseSchema>;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchClients(): Promise<ClientsResponse> {
  const res = await fetch('/api/v1/clients');

  if (!res.ok) {
    throw new ApiError(res.status, `Failed to fetch clients: ${String(res.status)}`);
  }

  const json: unknown = await res.json();
  return ClientsResponseSchema.parse(json);
}
