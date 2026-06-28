import { validateSOCPipeline } from "../audit/pipeline/socPipelineValidator";
import { socRBACEngine, type SOCPermission, type SOCRole } from "../security/rbac/socRBACEngine";
import { assertTenantIsolation } from "../security/tenant/socTenantGuard";
import { calculateSOCHealthScore } from "../health/socHealthScoreEngine";

export function validateEnterpriseOperation(input: { role: SOCRole; permission: SOCPermission; tenantId: string; records?: Array<{ tenantId?: string }>; pipelineSample?: unknown }) {
  const rbac = socRBACEngine.require(input.role, input.permission);
  const tenant = assertTenantIsolation(input.tenantId, input.records ?? []);
  const pipeline = validateSOCPipeline(input.pipelineSample ?? { ioc: "sample", riskScore: 0, providers: [] });
  const healthScore = calculateSOCHealthScore({ driftStable: true, automationSafe: true, incidentAccuracy: 80 });
  return { allowed: rbac.allowed && tenant.valid && pipeline.valid && healthScore >= 60, rbac, tenant, pipeline, healthScore };
}
