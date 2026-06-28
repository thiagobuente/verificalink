import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger';
import { recordError, recordRequest } from './metrics';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  recordRequest();
  res.on('finish', () => {
    const durationMs = Date.now() - started;
    const context = { method: req.method, path: req.path, statusCode: res.statusCode, durationMs };
    if (res.statusCode >= 500) {
      recordError();
      logger.error('request_failed', context);
    } else {
      logger.info('request_completed', context);
    }
  });
  next();
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  recordError();
  const requestId = randomUUID();
  logger.error('unhandled_error', { requestId, error: error instanceof Error ? error.message : String(error) });
  res.status(500).json({ error: 'Internal server error', requestId });
}
