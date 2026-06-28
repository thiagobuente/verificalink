import type { RemediationActionRequest } from "../../autonomous/remediation/remediationTypes";

const executedKeys = new Map<string, number>();
const windowMs = 10 * 60 * 1000;

function bucket(timestamp = Date.now()): number {
  return Math.floor(timestamp / windowMs);
}

export function generateManusIdempotencyKey(request: RemediationActionRequest, timestamp = Date.now()): string {
  return [request.tenantId, request.incidentId, request.actionType, bucket(timestamp)].join(":");
}

export class ManusIdempotencyKeyManager {
  reserve(request: RemediationActionRequest): { allowed: boolean; idempotencyKey: string; reason: string } {
    const now = Date.now();
    for (const [key, createdAt] of executedKeys.entries()) if (now - createdAt > windowMs) executedKeys.delete(key);
    const idempotencyKey = generateManusIdempotencyKey(request, now);
    if (executedKeys.has(idempotencyKey)) return { allowed: false, idempotencyKey, reason: "Duplicate Manus execution blocked by idempotency window" };
    executedKeys.set(idempotencyKey, now);
    return { allowed: true, idempotencyKey, reason: "Idempotency key reserved" };
  }

  release(idempotencyKey: string): void {
    executedKeys.delete(idempotencyKey);
  }

  list() {
    return [...executedKeys.entries()].map(([idempotencyKey, createdAt]) => ({ idempotencyKey, createdAt }));
  }
}

export const manusIdempotencyKeyManager = new ManusIdempotencyKeyManager();
