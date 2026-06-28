import { isRoleAllowed, type TenantContextValue } from "../../platform/tenant/tenantContext";

export function validateAction(context: TenantContextValue, actionType: string, confidence: number): { valid: boolean; reason: string } {
  if (!isRoleAllowed(context.role, "analyze") && !context.permissions.includes("*")) return { valid: false, reason: "Tenant lacks action permission" };
  if (/block/i.test(actionType)) return { valid: false, reason: "Block is prohibited from autonomous execution" };
  if (confidence < 50) return { valid: false, reason: "Confidence below automation threshold" };
  return { valid: true, reason: "Action passed safety validation" };
}
