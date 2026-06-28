export type RemediationActionType = "BLOCK_IP" | "BLOCK_DOMAIN" | "RATE_LIMIT" | "ISOLATE_IOC" | "QUARANTINE_ALERT" | "CREATE_TICKET" | "NOTIFY_ANALYST";
export type RemediationRiskLevel = "low" | "medium" | "high" | "critical";
export type RemediationExecutionStatus = "pending" | "sent" | "executing" | "pending_verification" | "confirmed" | "failed";

export interface RemediationActionRequest {
  tenantId: string;
  incidentId: string;
  actionType: RemediationActionType;
  confidence: number;
  correlationScore: number;
  riskLevel: RemediationRiskLevel;
  ioc?: string;
  rationale: string[];
  requestedBy: string;
  approvalId?: string;
  metadata?: Record<string, unknown>;
}

export interface RemediationActionResult {
  executionId: string;
  tenantId: string;
  incidentId: string;
  actionType: RemediationActionType;
  status: RemediationExecutionStatus;
  cloudStatus?: string;
  error?: string;
  timestamp: number;
}

export const remediationAllowlist: RemediationActionType[] = ["BLOCK_IP", "BLOCK_DOMAIN", "RATE_LIMIT", "ISOLATE_IOC", "QUARANTINE_ALERT", "CREATE_TICKET", "NOTIFY_ANALYST"];
export const destructiveRemediationActions: RemediationActionType[] = ["BLOCK_IP", "BLOCK_DOMAIN", "ISOLATE_IOC", "QUARANTINE_ALERT"];
