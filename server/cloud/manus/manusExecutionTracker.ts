import type { RemediationActionRequest, RemediationActionResult, RemediationExecutionStatus } from "../../autonomous/remediation/remediationTypes";

export interface ManusExecutionRecord extends RemediationActionResult {
  request: RemediationActionRequest;
  attempts: number;
  timeoutAt: number;
  updatedAt: number;
  idempotencyKey?: string;
  fingerprint?: string;
  cloudConfirmedAt?: number;
}

const executions = new Map<string, ManusExecutionRecord>();
const reservedFingerprints = new Map<string, number>();
const defaultTimeoutMs = Number(process.env.MANUS_EXECUTION_TIMEOUT_MS || 30000);

const transitions: Record<RemediationExecutionStatus, RemediationExecutionStatus[]> = {
  pending: ["sent", "failed"],
  sent: ["executing", "pending_verification", "failed"],
  executing: ["pending_verification", "confirmed", "failed"],
  pending_verification: ["confirmed", "failed"],
  confirmed: [],
  failed: [],
};

function executionId(input: RemediationActionRequest): string {
  return [input.tenantId, input.incidentId, input.actionType, Date.now()].join(":");
}

export class ManusExecutionTracker {
  create(request: RemediationActionRequest, extra: { idempotencyKey?: string; fingerprint?: string } = {}): ManusExecutionRecord {
    const now = Date.now();
    const record: ManusExecutionRecord = {
      executionId: executionId(request),
      tenantId: request.tenantId,
      incidentId: request.incidentId,
      actionType: request.actionType,
      status: "pending",
      timestamp: now,
      request,
      attempts: 0,
      timeoutAt: now + defaultTimeoutMs,
      updatedAt: now,
      ...extra,
    };
    executions.set(record.executionId, record);
    return record;
  }

  reserveFingerprint(fingerprint: string, timestamp = Date.now()): void {
    reservedFingerprints.set(fingerprint, timestamp);
  }

  update(executionIdValue: string, patch: Partial<Pick<ManusExecutionRecord, "status" | "cloudStatus" | "error" | "attempts" | "idempotencyKey" | "fingerprint">> & { cloudConfirmed?: boolean }): ManusExecutionRecord | undefined {
    const record = executions.get(executionIdValue);
    if (!record) return undefined;
    let nextStatus = patch.status ?? (record.timeoutAt < Date.now() && ["sent", "executing", "pending_verification"].includes(record.status) ? "failed" : record.status);
    if (nextStatus === "confirmed" && !patch.cloudConfirmed) nextStatus = "pending_verification";
    if (nextStatus !== record.status && !transitions[record.status].includes(nextStatus)) nextStatus = record.status;
    const updated = { ...record, ...patch, status: nextStatus, cloudConfirmedAt: nextStatus === "confirmed" ? Date.now() : record.cloudConfirmedAt, updatedAt: Date.now() };
    executions.set(executionIdValue, updated);
    return updated;
  }

  confirm(executionIdValue: string, cloudStatus = "confirmed"): ManusExecutionRecord | undefined {
    return this.update(executionIdValue, { status: "confirmed", cloudStatus, cloudConfirmed: true });
  }

  list(status?: RemediationExecutionStatus): ManusExecutionRecord[] {
    return [...executions.values()].filter((record) => !status || record.status === status).slice().reverse();
  }

  fingerprints() {
    return [...reservedFingerprints.entries()].map(([fingerprint, timestamp]) => ({ fingerprint, timestamp }));
  }
}

export const manusExecutionTracker = new ManusExecutionTracker();
