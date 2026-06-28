import type { NextFunction, Request, Response } from "express";
import { recordTenantUsage } from "../saas/tenantProvisioning";
import { getTenantContext, isRoleAllowed } from "../tenant/tenantContext";
import { tenantMiddleware } from "../tenant/tenantMiddleware";
import { tenantRateLimiter } from "../rateLimit/tenantRateLimiter";
import { recordTenantApiUsage } from "../../providers/storage/metrics";

function permissionFor(req: Request): string {
  const routePath = req.baseUrl + req.path;
  if (/replay/i.test(routePath)) return "replay";
  if (req.method === "GET") return "read";
  if (/aggregate|ioc/i.test(routePath)) return "analyze";
  return "analyze";
}

export function apiGateway(req: Request, res: Response, next: NextFunction): void {
  tenantMiddleware(req, res, () => {
    tenantRateLimiter(req, res, () => {
      const context = getTenantContext();
      if (context) {
        const permission = permissionFor(req);
        if (!context.permissions.includes("*") && !context.permissions.includes(permission) && !isRoleAllowed(context.role, permission)) {
          res.status(403).json({ success: false, error: "Tenant permission denied" });
          return;
        }
        recordTenantUsage(context.tenantId, { apiCalls: 1 });
        recordTenantApiUsage(context.tenantId);
      }
      next();
    });
  });
}
