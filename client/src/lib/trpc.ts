import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/trpc';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: 'include' });
        },
      }),
    ],
  });
}
