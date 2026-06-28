import { limitedResponseEngine } from "../../global/autonomous/limitedResponseEngine";
import { evaluateSOCActionApproval } from "../gates/socActionApprovalGate";
import { canAutoExecuteSafeActions, getSOCAutonomousMode } from "../mode/socAutonomousModeController";
import { socSOARAuditLogger } from "../audit/socSOARAuditLogger";

export interface AutonomousDecisionInput {
  incidentId: string;
  actionType: string;
  confidence: number;
  severity?: string;
  providerCount?: number;
  multiProviderConfirmed?: boolean;
  rationale?: string[];
}

export class SOCAutonomousEngine {
  evaluate(input: AutonomousDecisionInput) {
    const mode = getSOCAutonomousMode();
    const approval = evaluateSOCActionApproval(input);
    const safeAuto = canAutoExecuteSafeActions() && approval.approved;
    const executed = safeAuto ? limitedResponseEngine.evaluate({ incidentId: input.incidentId, actionType: input.actionType, confidence: input.confidence, rationale: input.rationale }) : undefined;
    socSOARAuditLogger.log({ incidentId: input.incidentId, action: input.actionType, decision: mode, approved: Boolean(executed && executed.status === "executed"), rationale: [approval.reason, ...(input.rationale ?? [])] });
    return { mode, approval, executed, recommendation: safeAuto ? "safe action evaluated" : "manual review required" };
  }
}

export const socAutonomousEngine = new SOCAutonomousEngine();
