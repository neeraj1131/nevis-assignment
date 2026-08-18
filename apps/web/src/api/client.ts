import { ClientsResponseSchema, type ClientsResponse } from '@nevis/shared';

export type { ClientsResponse };

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchClients(): Promise<ClientsResponse> {
  // M11 (deferred): no client-side timeout/AbortController — a hung request
  // relies on the browser's own connection timeout. Acceptable for this
  // same-origin, low-latency dev/prod topology; would want one before
  // pointing this at a less predictable network.
  const res = await fetch('/api/v1/clients');

  if (!res.ok) {
    throw new ApiError(res.status, `Failed to fetch clients: ${String(res.status)}`);
  }

  const json: unknown = await res.json();
  return ClientsResponseSchema.parse(json);
}
