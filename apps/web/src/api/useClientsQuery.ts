import { useQuery } from '@tanstack/react-query';
import { fetchClients } from './client.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useClientsQuery() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: FIVE_MINUTES_MS,
  });
}
