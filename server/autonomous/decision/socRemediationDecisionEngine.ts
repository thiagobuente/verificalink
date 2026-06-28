import type { RemediationActionType, RemediationRiskLevel } from "../remediation/remediationTypes";

export interface RemediationDecisionInput {
  incidentId: string;
  correlationScore: number;
  attackType?: string;
  providerConfidence: number;
  severity?: RemediationRiskLevel | string;
  providerCount?: number;
  systemHealth?: number;
  driftStatus?: "stable" | "unstable" | "recovery_mode" | string;
  multiProviderConfirmed?: boolean;
}

export interface RemediationDecision {
  actionType: RemediationActionType;
  confidence: number;
  requiresApproval: boolean;
  riskLevel: RemediationRiskLevel;
  rationale: string[];
}

function riskLevel(score: number, severity?: string): RemediationRiskLevel {
  if (severity === "critical" || score >= 85) return "critical";
  if (severity === "high" || score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export class SOCRemediationDecisionEngine {
  decide(input: RemediationDecisionInput): RemediationDecision {
    const confidence = Math.max(0, Math.min(100, Math.round((input.correlationScore + input.providerConfidence) / 2)));
    const level = riskLevel(Math.max(input.correlationScore, confidence), input.severity);
    const attack = (input.attackType ?? "").toLowerCase();
    let actionType: RemediationActionType = "NOTIFY_ANALYST";
    const rationale: string[] = ["Decision based on correlation score and provider confidence"];
    if ((input.systemHealth ?? 100) < 60 || input.driftStatus === "unstable" || input.driftStatus === "recovery_mode") {
      actionType = "CREATE_TICKET";
      rationale.push("System health or drift status prevents autonomous action");
    } else if (confidence < 50 || input.correlationScore < 30) {
      actionType = "CREATE_TICKET";
      rationale.push("Low confidence keeps remediation in ticket-only mode");
    } else if (attack.includes("scanning") || attack.includes("scan")) {
      actionType = input.correlationScore >= 70 ? "RATE_LIMIT" : "NOTIFY_ANALYST";
      rationale.push("Scanning behavior favors rate limit or analyst notification");
    } else if (attack.includes("malware") && input.providerCount && input.providerCount >= 2 && input.multiProviderConfirmed) {
      actionType = level === "critical" ? "BLOCK_IP" : "QUARANTINE_ALERT";
      rationale.push("Malware signal with provider agreement increases containment priority");
    } else if (attack.includes("phishing") && input.multiProviderConfirmed) {
      actionType = "BLOCK_DOMAIN";
      rationale.push("Phishing infrastructure maps to domain blocking request with provider confirmation");
    }
    if ((actionType === "BLOCK_IP" || actionType === "BLOCK_DOMAIN") && !input.multiProviderConfirmed) {
      actionType = "NOTIFY_ANALYST";
      rationale.push("Block action downgraded because multi-provider confirmation is missing");
    }
    const requiresApproval = ["BLOCK_IP", "BLOCK_DOMAIN", "ISOLATE_IOC", "QUARANTINE_ALERT"].includes(actionType) || confidence <= 85 || input.correlationScore <= 70;
    return { actionType, confidence, requiresApproval, riskLevel: level, rationale };
  }
}

export const socRemediationDecisionEngine = new SOCRemediationDecisionEngine();
