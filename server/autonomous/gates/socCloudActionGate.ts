import { destructiveRemediationActions, remediationAllowlist, type RemediationActionRequest, type RemediationActionType } from "../remediation/remediationTypes";

const blocklist = [/shell/i, /exec/i, /command/i, /deploy/i, /shutdown/i, /delete/i, /rms+-rf/i, /powershell/i, /bash/i, /cmd.exe/i];

export interface CloudActionGateDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reasons: string[];
}

function isAllowedAction(actionType: string): actionType is RemediationActionType {
  return remediationAllowlist.includes(actionType as RemediationActionType);
}

function containsBlockedCommand(input: RemediationActionRequest): boolean {
  const haystack = [input.actionType, input.ioc, ...input.rationale, JSON.stringify(input.metadata ?? {})].join(" ");
  return blocklist.some((pattern) => pattern.test(haystack));
}

export function evaluateCloudActionGate(input: RemediationActionRequest): CloudActionGateDecision {
  const reasons: string[] = [];
  if (!isAllowedAction(input.actionType)) reasons.push("Action is not in the remediation allowlist");
  if (containsBlockedCommand(input)) reasons.push("Action payload contains blocked command-like content");
  if (input.confidence < 50) reasons.push("Confidence is below minimum cloud execution threshold");
  if (input.correlationScore < 30) reasons.push("Correlation score is below minimum cloud execution threshold");
  const destructive = destructiveRemediationActions.includes(input.actionType);
  if (destructive && !input.approvalId) reasons.push("Destructive remediation requires human approval");
  if (destructive && (input.confidence < 85 || input.correlationScore < 70)) reasons.push("Destructive remediation requires confidence > 85 and correlationScore > 70");
  return { allowed: reasons.length === 0, requiresApproval: destructive || input.confidence <= 85 || input.correlationScore <= 70, reasons: reasons.length ? reasons : ["Cloud action passed allowlist, confidence, and correlation checks"] };
}

export function getCloudActionPolicy() {
  return { allowlist: remediationAllowlist, blocklist: blocklist.map((pattern) => pattern.source), destructiveActions: destructiveRemediationActions };
}
