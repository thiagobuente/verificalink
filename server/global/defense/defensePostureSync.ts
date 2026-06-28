import { anonymizeTenantId } from "../intelligence/anonymizer";
import { defenseAuditLogger } from "./defenseAudit";
import type { DefensePosture } from "./defenseModels";

const postureStore = new Map<string, DefensePosture>();

export function getTenantDefensePosture(tenantId: string): DefensePosture {
  return postureStore.get(anonymizeTenantId(tenantId)) ?? "balanced";
}

export function setTenantDefensePosture(tenantId: string, posture: DefensePosture): DefensePosture {
  postureStore.set(anonymizeTenantId(tenantId), posture);
  defenseAuditLogger.log("posture_changed", "Tenant defense posture changed", { tenant: anonymizeTenantId(tenantId), posture });
  return posture;
}

export function listDefensePostures(): Array<{ tenant: string; posture: DefensePosture }> {
  return [...postureStore.entries()].map(([tenant, posture]) => ({ tenant, posture }));
}

export function postureSeverityModifier(posture: DefensePosture): number {
  if (posture === "locked") return -10;
  if (posture === "hardened") return -5;
  if (posture === "relaxed") return 8;
  return 0;
}
