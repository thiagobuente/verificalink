import type { AutonomousActionRecord } from "./autonomousModels";

const executedFingerprints = new Map<string, number>();
const incidentCooldown = new Map<string, number>();
const cooldownMs = 10 * 60 * 1000;

function actionFingerprint(record: AutonomousActionRecord): string {
  let hash = 2166136261;
  const input = [record.incidentId, record.actionType].join("|");
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return "auto_" + (hash >>> 0).toString(16);
}

export class SafeActionExecutor {
  execute(record: AutonomousActionRecord): AutonomousActionRecord {
    const now = Date.now();
    const fingerprint = actionFingerprint(record);
    if ((executedFingerprints.get(fingerprint) ?? 0) + cooldownMs > now || (incidentCooldown.get(record.incidentId) ?? 0) + cooldownMs > now) {
      return { ...record, id: fingerprint, status: "blocked", reversible: true, rationale: [...record.rationale, "Duplicate autonomous action suppressed by cooldown"] };
    }
    if (!/alert|monitor|tag|ticket|rate_limit/i.test(record.actionType) || /block|firewall|shutdown/i.test(record.actionType)) {
      return { ...record, id: fingerprint, status: "blocked", reversible: false };
    }
    executedFingerprints.set(fingerprint, now);
    incidentCooldown.set(record.incidentId, now);
    return { ...record, id: fingerprint, status: "executed", reversible: true };
  }
}

export const safeActionExecutor = new SafeActionExecutor();
