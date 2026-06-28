export interface ApprovalDecision {
  approved: boolean;
  requiresManualApproval: boolean;
  reason: string;
}

export function evaluateSOCActionApproval(input: { actionType: string; confidence: number; providerCount?: number; multiProviderConfirmed?: boolean }): ApprovalDecision {
  if (/block|firewall|contain|quarantine/i.test(input.actionType)) {
    const strongEnough = input.confidence >= 85 && Boolean(input.multiProviderConfirmed) && (input.providerCount ?? 0) >= 2;
    return { approved: false, requiresManualApproval: true, reason: strongEnough ? "Sensitive action prepared for manual approval" : "Sensitive action blocked until confidence and provider agreement improve" };
  }
  if (/rate_limit/i.test(input.actionType) && input.confidence < 85) return { approved: false, requiresManualApproval: true, reason: "Rate limit requires high confidence" };
  if (/alert|monitor|ticket|tag/i.test(input.actionType)) return { approved: true, requiresManualApproval: false, reason: "Safe action allowed" };
  return { approved: false, requiresManualApproval: true, reason: "Unknown action requires manual review" };
}
