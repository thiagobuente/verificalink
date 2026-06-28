export type TenantPlan = "free" | "pro" | "enterprise";

export interface TenantUsage {
  tenantId: string;
  iocProcessed: number;
  incidentsGenerated: number;
  apiCalls: number;
  correlationRuns: number;
}

export interface TenantRecord {
  tenantId: string;
  plan: TenantPlan;
  createdAt: number;
  enabled: boolean;
}

const tenants = new Map<string, TenantRecord>();
const usage = new Map<string, TenantUsage>();

export function provisionTenant(tenantId: string, plan: TenantPlan = "free"): TenantRecord {
  const existing = tenants.get(tenantId);
  if (existing) return existing;
  const record = { tenantId, plan, createdAt: Date.now(), enabled: true };
  tenants.set(tenantId, record);
  usage.set(tenantId, { tenantId, iocProcessed: 0, incidentsGenerated: 0, apiCalls: 0, correlationRuns: 0 });
  return record;
}

export function getTenantPlan(tenantId: string): TenantPlan {
  return tenants.get(tenantId)?.plan ?? "free";
}

export function recordTenantUsage(tenantId: string, delta: Partial<Omit<TenantUsage, "tenantId">>): TenantUsage {
  const current = usage.get(tenantId) ?? { tenantId, iocProcessed: 0, incidentsGenerated: 0, apiCalls: 0, correlationRuns: 0 };
  const next = {
    tenantId,
    iocProcessed: current.iocProcessed + (delta.iocProcessed ?? 0),
    incidentsGenerated: current.incidentsGenerated + (delta.incidentsGenerated ?? 0),
    apiCalls: current.apiCalls + (delta.apiCalls ?? 0),
    correlationRuns: current.correlationRuns + (delta.correlationRuns ?? 0),
  };
  usage.set(tenantId, next);
  return next;
}

export function getTenantUsage(tenantId: string): TenantUsage {
  return usage.get(tenantId) ?? recordTenantUsage(tenantId, {});
}
