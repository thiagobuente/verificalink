import { manusExecutionTracker } from "../../cloud/manus/manusExecutionTracker";
import type { RemediationActionRequest } from "./remediationTypes";

const fingerprints = new Map<string, number>();
const windowMs = 10 * 60 * 1000;

function hash(input: string): string {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16);
}

export function executionFingerprint(request: RemediationActionRequest): string {
  return hash([request.tenantId, request.incidentId, request.actionType, request.ioc ?? "none"].join("|"));
}

export class DoubleExecutionGuard {
  reserve(request: RemediationActionRequest): { allowed: boolean; fingerprint: string; reason: string } {
    const now = Date.now();
    for (const [key, createdAt] of fingerprints.entries()) if (now - createdAt > windowMs) fingerprints.delete(key);
    const fingerprint = executionFingerprint(request);
    const activeTrackerRecord = manusExecutionTracker.list().some((record) => record.incidentId === request.incidentId && record.actionType === request.actionType && ["pending", "sent", "executing", "pending_verification"].includes(record.status));
    if (fingerprints.has(fingerprint) || activeTrackerRecord) return { allowed: false, fingerprint, reason: "Duplicate remediation execution blocked for 10 minutes" };
    fingerprints.set(fingerprint, now);
    manusExecutionTracker.reserveFingerprint(fingerprint, now);
    return { allowed: true, fingerprint, reason: "Execution fingerprint reserved" };
  }

  list() {
    return [...fingerprints.entries()].map(([fingerprint, createdAt]) => ({ fingerprint, createdAt }));
  }
}

export const doubleExecutionGuard = new DoubleExecutionGuard();
