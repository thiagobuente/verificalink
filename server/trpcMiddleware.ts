import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc';

export const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext: () => ({}),
});
