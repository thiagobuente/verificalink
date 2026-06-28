import type { RemediationActionRequest } from "../remediation/remediationTypes";

const incidentCooldown = new Map<string, number>();
const cooldownMs = 10 * 60 * 1000;
let failsafeMode = false;
const failsafeReasons: string[] = [];

export interface GlobalSafetyDecision {
  allowed: boolean;
  reasons: string[];
}

export function activateFailsafeMode(reason: string): void {
  failsafeMode = true;
  failsafeReasons.push(reason);
  if (failsafeReasons.length > 20) failsafeReasons.shift();
}

export function clearFailsafeMode(): void {
  failsafeMode = false;
  failsafeReasons.length = 0;
}

export function getFailsafeMode() {
  return { active: failsafeMode, reasons: [...failsafeReasons] };
}

export function evaluateGlobalSafetyRules(input: { request: RemediationActionRequest; validated: boolean; approved: boolean; systemHealthScore: number }): GlobalSafetyDecision {
  const reasons: string[] = [];
  const last = incidentCooldown.get(input.request.incidentId) ?? 0;
  if (failsafeMode) reasons.push("FAILSAFE_MODE active: cloud executions are blocked; monitoring only");
  if (!input.validated) reasons.push("Action was not validated by cloud action gate");
  if (["BLOCK_IP", "BLOCK_DOMAIN", "ISOLATE_IOC", "QUARANTINE_ALERT"].includes(input.request.actionType) && !input.approved) reasons.push("Destructive action requires approval");
  if (Date.now() - last < cooldownMs) reasons.push("Incident remediation cooldown is active");
  if (input.systemHealthScore < 60) reasons.push("System health below 60 blocks auto-remediation");
  const allowed = reasons.length === 0;
  if (allowed) incidentCooldown.set(input.request.incidentId, Date.now());
  return { allowed, reasons: allowed ? ["Global safety rules passed"] : reasons };
}

export function getGlobalSafetyCooldowns() {
  return [...incidentCooldown.entries()].map(([incidentId, timestamp]) => ({ incidentId, timestamp }));
}
