import { manusCloudConnector } from "../../cloud/manus/manusCloudConnector";
import { manusExecutionTracker } from "../../cloud/manus/manusExecutionTracker";
import { calculateSOCHealthScore } from "../../health/socHealthScoreEngine";
import { cloudExecutionAuditLogger } from "../audit/cloudExecutionAuditLogger";
import { evaluateCloudActionGate } from "../gates/socCloudActionGate";
import { socHumanApprovalEngine } from "../human/socHumanApprovalEngine";
import { globalExecutionLock } from "../locks/globalExecutionLock";
import { getSOCAutonomousMode } from "../mode/socAutonomousModeController";
import { socRemediationDecisionEngine, type RemediationDecisionInput } from "../decision/socRemediationDecisionEngine";
import { evaluateGlobalSafetyRules } from "../safety/socGlobalSafetyRules";
import { remediationStateMachine } from "./remediationStateMachine";
import type { RemediationActionRequest, RemediationActionResult } from "./remediationTypes";
import { socRollbackEngine } from "./socRollbackEngine";

export interface SafeRemediationInput extends RemediationDecisionInput {
  tenantId: string;
  ioc?: string;
  requestedBy?: string;
  metadata?: Record<string, unknown>;
  approvalId?: string;
}

export interface SafeRemediationOutput {
  status: "recommended" | "pending_approval" | "sent_to_cloud" | "blocked";
  decision: ReturnType<typeof socRemediationDecisionEngine.decide>;
  gate: ReturnType<typeof evaluateCloudActionGate>;
  approval?: ReturnType<typeof socHumanApprovalEngine.requestApproval>;
  result?: RemediationActionResult;
  reasons: string[];
}

export class SOCSafeRemediationEngine {
  async run(input: SafeRemediationInput): Promise<SafeRemediationOutput> {
    return globalExecutionLock.runExclusive(input.incidentId, async () => this.execute(input));
  }

  private async execute(input: SafeRemediationInput): Promise<SafeRemediationOutput> {
    const mode = getSOCAutonomousMode();
    const healthScore = calculateSOCHealthScore({ driftStable: input.driftStatus !== "unstable", automationSafe: true, incidentAccuracy: 90 });
    const decision = socRemediationDecisionEngine.decide({ ...input, systemHealth: input.systemHealth ?? healthScore });
    const request: RemediationActionRequest = {
      tenantId: input.tenantId,
      incidentId: input.incidentId,
      actionType: decision.actionType,
      confidence: decision.confidence,
      correlationScore: input.correlationScore,
      riskLevel: decision.riskLevel,
      ioc: input.ioc,
      rationale: decision.rationale,
      requestedBy: input.requestedBy ?? "soc-system",
      approvalId: input.approvalId,
      metadata: { ...(input.metadata ?? {}), executionPath: "socSafeRemediationEngine" },
    };
    const gate = evaluateCloudActionGate(request);
    const state = remediationStateMachine.start([request.tenantId, request.incidentId, request.actionType].join(":"), request.incidentId);
    remediationStateMachine.transition(state.executionId, gate.allowed ? "validated" : "failed", gate.reasons.join("; "));
    if (!gate.allowed) {
      cloudExecutionAuditLogger.log({ request, status: "blocked" });
      return { status: "blocked", decision, gate, reasons: gate.reasons };
    }

    const approvedByMode = mode === "LIMITED_AUTO" || (mode === "FULL_AUTO" && healthScore > 90);
    const needsHuman = mode === "OFF" || mode === "ASSISTED" || decision.requiresApproval || socHumanApprovalEngine.requiresApproval(request);
    if (input.approvalId) {
      const approval = socHumanApprovalEngine.validateForExecution(input.approvalId, request);
      if (!approval.valid) return { status: "blocked", decision, gate, reasons: [approval.reason] };
      request.approvalId = input.approvalId;
    } else if (needsHuman || !approvedByMode) {
      const approval = socHumanApprovalEngine.requestApproval(request, "Remediation requires human approval or assisted mode");
      return { status: mode === "OFF" ? "recommended" : "pending_approval", decision, gate, approval, reasons: ["Human approval required before cloud execution"] };
    }

    const safety = evaluateGlobalSafetyRules({ request, validated: true, approved: Boolean(request.approvalId) || !needsHuman, systemHealthScore: healthScore });
    if (!safety.allowed) {
      cloudExecutionAuditLogger.log({ request, status: "blocked" });
      return { status: "blocked", decision, gate, reasons: safety.reasons };
    }

    remediationStateMachine.transition(state.executionId, "approved", "Approved safe remediation path");
    remediationStateMachine.transition(state.executionId, "sent_to_cloud", "Sending to Manus connector");
    const result = await manusCloudConnector.sendAction(request, { validatedBy: "socSafeRemediationEngine", gatePassed: gate.allowed, decisionPassed: true });
    if (result.status === "confirmed") {
      remediationStateMachine.transition(state.executionId, "executing", result.cloudStatus);
      remediationStateMachine.transition(state.executionId, "completed", result.cloudStatus);
    } else {
      remediationStateMachine.transition(state.executionId, result.status === "failed" ? "failed" : "executing", result.error ?? result.cloudStatus);
    }
    if (result.status === "confirmed" && ["BLOCK_IP", "BLOCK_DOMAIN", "ISOLATE_IOC", "QUARANTINE_ALERT"].includes(result.actionType)) socRollbackEngine.prepare({ executionId: result.executionId, request });
    return { status: "sent_to_cloud", decision, gate, result, reasons: ["Remediation was sent to Manus through secure connector"] };
  }

  status(tenantId?: string) {
    const executions = manusExecutionTracker.list().filter((record) => !tenantId || record.tenantId === tenantId);
    return {
      pending: executions.filter((record) => ["pending", "sent", "executing", "pending_verification"].includes(record.status)),
      executed: executions.filter((record) => record.status === "confirmed"),
      failures: executions.filter((record) => record.status === "failed"),
      rollbackHistory: socRollbackEngine.list(),
      approvals: socHumanApprovalEngine.list(),
      audit: cloudExecutionAuditLogger.list(tenantId).slice(0, 100),
    };
  }
}

export const socSafeRemediationEngine = new SOCSafeRemediationEngine();
