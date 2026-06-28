import { recordApprovalDelay } from "../../observability/remediationMetrics";
import type { RemediationActionRequest } from "../remediation/remediationTypes";

export interface HumanApprovalRecord {
  approvalId: string;
  request: RemediationActionRequest;
  status: "pending" | "approved" | "rejected" | "expired" | "used";
  createdAt: number;
  expiresAt: number;
  decidedAt?: number;
  decidedBy?: string;
  reason?: string;
  usedAt?: number;
}

const approvals = new Map<string, HumanApprovalRecord>();
const approvalTtlMs = 10 * 60 * 1000;

function approvalId(input: RemediationActionRequest): string {
  return [input.tenantId, input.incidentId, input.actionType, Date.now()].join(":");
}

function refreshExpiry(record: HumanApprovalRecord): HumanApprovalRecord {
  if ((record.status === "pending" || record.status === "approved") && Date.now() > record.expiresAt) {
    const expired = { ...record, status: "expired" as const, reason: "Approval expired" };
    approvals.set(record.approvalId, expired);
    return expired;
  }
  return record;
}

export class SOCHumanApprovalEngine {
  requiresApproval(input: RemediationActionRequest): boolean {
    if (input.confidence <= 85 || input.correlationScore <= 70) return true;
    if (input.actionType === "BLOCK_IP" && input.riskLevel === "critical") return true;
    return ["BLOCK_DOMAIN", "ISOLATE_IOC", "QUARANTINE_ALERT"].includes(input.actionType);
  }

  requestApproval(input: RemediationActionRequest, reason = "Human approval required"): HumanApprovalRecord {
    const now = Date.now();
    const record = { approvalId: approvalId(input), request: input, status: "pending" as const, createdAt: now, expiresAt: now + approvalTtlMs, reason };
    approvals.set(record.approvalId, record);
    return record;
  }

  decide(approvalIdValue: string, approved: boolean, decidedBy: string, reason?: string): HumanApprovalRecord | undefined {
    const current = approvals.get(approvalIdValue);
    if (!current) return undefined;
    const record = refreshExpiry(current);
    if (record.status === "expired" || record.status === "used") return record;
    const updated = { ...record, status: approved ? "approved" as const : "rejected" as const, decidedAt: Date.now(), decidedBy, reason };
    recordApprovalDelay(Date.now() - record.createdAt);
    approvals.set(approvalIdValue, updated);
    return updated;
  }

  validateForExecution(approvalIdValue: string, request: RemediationActionRequest): { valid: boolean; reason: string } {
    const current = approvals.get(approvalIdValue);
    if (!current) return { valid: false, reason: "Approval not found" };
    const record = refreshExpiry(current);
    if (record.status !== "approved") return { valid: false, reason: "Approval is not approved or has expired" };
    if (record.request.incidentId !== request.incidentId || record.request.actionType !== request.actionType) return { valid: false, reason: "Approval does not match execution request" };
    approvals.set(approvalIdValue, { ...record, status: "used", usedAt: Date.now() });
    return { valid: true, reason: "Approval validated for one-time execution" };
  }

  list(status?: HumanApprovalRecord["status"]): HumanApprovalRecord[] {
    return [...approvals.values()].map(refreshExpiry).filter((record) => !status || record.status === status).slice().reverse();
  }
}

export const socHumanApprovalEngine = new SOCHumanApprovalEngine();
