import type { NextFunction, Request, Response } from "express";
import { getTenantContext } from "../tenant/tenantContext";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const windowMs = 60 * 1000;

function endpointLimit(path: string, baseLimit: number): number {
  if (/replay/i.test(path)) return Math.min(baseLimit, 10);
  if (/aggregate|ioc/i.test(path)) return Math.min(baseLimit, 30);
  return Math.min(baseLimit, 100);
}

export function tenantRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const routePath = req.baseUrl + req.path;
  if (!routePath.startsWith("/api")) {
    next();
    return;
  }
  const context = getTenantContext();
  if (!context) {
    next();
    return;
  }
  const limit = endpointLimit(routePath, context.rateLimit);
  const key = [context.apiKey ?? context.tenantId, req.method, routePath].join(":");
  const now = Date.now();
  const bucket = buckets.get(key) ?? { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > limit) {
    res.status(429).json({ success: false, error: "Tenant rate limit exceeded" });
    return;
  }
  next();
}
