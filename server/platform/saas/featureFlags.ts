import { getTenantPlan } from "./tenantProvisioning";

export interface TenantFeatureFlags {
  aiOperator: boolean;
  orchestration: boolean;
  replay: boolean;
}

const overrides = new Map<string, Partial<TenantFeatureFlags>>();

function defaults(plan: string): TenantFeatureFlags {
  if (plan === "enterprise") return { aiOperator: true, orchestration: true, replay: true };
  if (plan === "pro") return { aiOperator: true, orchestration: true, replay: false };
  return { aiOperator: true, orchestration: true, replay: true };
}

export function setTenantFeatureFlags(tenantId: string, flags: Partial<TenantFeatureFlags>): void {
  overrides.set(tenantId, flags);
}

export function getTenantFeatureFlags(tenantId: string): TenantFeatureFlags {
  return { ...defaults(getTenantPlan(tenantId)), ...(overrides.get(tenantId) ?? {}) };
}
