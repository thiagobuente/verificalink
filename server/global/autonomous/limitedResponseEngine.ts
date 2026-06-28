import { getTenantContext } from "../../platform/tenant/tenantContext";
import { autonomousAuditLogger } from "./autonomousAuditLogger";
import type { AutonomousActionRecord } from "./autonomousModels";
import { requiresHumanApproval } from "./approvalGate";
import { validateAction } from "./actionValidator";
import { shouldExecute } from "./executionDecisionEngine";
import { shouldEmitAlert } from "./intelligentAlertEngine";
import { safeActionExecutor } from "./safeActionExecutor";

const cooldown = new Map<string, number>();
const cooldownMs = 5 * 60 * 1000;

function id(tenantId: string, incidentId: string, actionType: string): string {
  return [tenantId, incidentId, actionType].join(":");
}

export class LimitedResponseEngine {
  evaluate(input: { incidentId: string; actionType: string; confidence: number; rationale?: string[] }): AutonomousActionRecord {
    const context = getTenantContext();
    const tenantId = context?.tenantId ?? "unknown";
    const actionId = id(tenantId, input.incidentId, input.actionType);
    const decision = shouldExecute(input.actionType, input.confidence);
    const validation = context ? validateAction(context, input.actionType, input.confidence) : { valid: false, reason: "Tenant context missing" };
    const now = Date.now();
    let record: AutonomousActionRecord = {
      id: actionId,
      tenantId,
      incidentId: input.incidentId,
      actionType: input.actionType,
      automationLevel: decision.level,
      status: "pending",
      confidence: input.confidence,
      rationale: [decision.reason, validation.reason, ...(input.rationale ?? [])],
      reversible: true,
      timestamp: now,
    };
    if ((cooldown.get(actionId) ?? 0) + cooldownMs > now || requiresHumanApproval(input.actionType, input.confidence) || !decision.allowed || !validation.valid || !shouldEmitAlert(actionId)) {
      record = { ...record, status: "blocked" };
    } else {
      cooldown.set(actionId, now);
      record = safeActionExecutor.execute(record);
    }
    autonomousAuditLogger.log(record);
    return record;
  }

  status(tenantId?: string) {
    const records = autonomousAuditLogger.list(tenantId);
    return {
      executed: records.filter((record) => record.status === "executed"),
      pending: records.filter((record) => record.status === "pending"),
      blocked: records.filter((record) => record.status === "blocked"),
    };
  }
}

export const limitedResponseEngine = new LimitedResponseEngine();
