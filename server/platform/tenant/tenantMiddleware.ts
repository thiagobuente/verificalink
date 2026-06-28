import type { NextFunction, Request, Response } from "express";
import { resolveApiKey, runWithTenant, type TenantContextValue, type TenantRole } from "./tenantContext";

const publicApiPaths = new Set(["/health", "/metrics"]);

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function bearerToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function roleFromHeader(value: string | undefined): TenantRole {
  if (value === "admin" || value === "analyst" || value === "viewer" || value === "api_client") return value;
  return "api_client";
}

function contextFromRequest(req: Request): TenantContextValue | undefined {
  const apiKey = headerValue(req.headers["x-api-key"]) ?? bearerToken(headerValue(req.headers.authorization));
  const keyRecord = resolveApiKey(apiKey);
  if (keyRecord) {
    return {
      tenantId: keyRecord.tenantId,
      role: keyRecord.role ?? "api_client",
      permissions: keyRecord.permissions,
      apiKey: keyRecord.key,
      rateLimit: keyRecord.rateLimit,
    };
  }

  if (process.env.TENANT_API_KEYS) return undefined;
  const tenantId = headerValue(req.headers["x-tenant-id"]);
  if (!tenantId || !/^[a-zA-Z0-9_-]{2,64}$/.test(tenantId)) return undefined;
  const role = roleFromHeader(headerValue(req.headers["x-tenant-role"]));
  return {
    tenantId,
    role,
    permissions: role === "admin" ? ["*"] : role === "viewer" ? ["read"] : ["read", "analyze", "replay"],
    rateLimit: Number(process.env.TENANT_DEFAULT_RATE_LIMIT || 100),
  };
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const routePath = req.baseUrl + req.path;
  if (!routePath.startsWith("/api") || publicApiPaths.has(routePath)) {
    next();
    return;
  }
  const context = contextFromRequest(req);
  if (!context) {
    res.status(401).json({ success: false, error: "Tenant context required" });
    return;
  }
  runWithTenant(context, next);
}
