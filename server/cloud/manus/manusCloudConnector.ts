import { cloudExecutionAuditLogger } from "../../autonomous/audit/cloudExecutionAuditLogger";
import { doubleExecutionGuard } from "../../autonomous/remediation/doubleExecutionGuard";
import type { RemediationActionRequest, RemediationActionResult } from "../../autonomous/remediation/remediationTypes";
import { evaluateCloudActionGate } from "../../autonomous/gates/socCloudActionGate";
import { activateFailsafeMode } from "../../autonomous/safety/socGlobalSafetyRules";
import { recordRemediationExecutionLatency, recordRemediationFailure } from "../../observability/remediationMetrics";
import { manusApiAdapter } from "./manusApiAdapter";
import { manusConfirmationPoller } from "./manusConfirmationPoller";
import { manusEventSync } from "./manusEventSync";
import { manusExecutionTracker } from "./manusExecutionTracker";
import { manusIdempotencyKeyManager } from "./manusIdempotencyKeyManager";

export interface ManusExecutionContext {
  validatedBy: "socSafeRemediationEngine";
  gatePassed: boolean;
  decisionPassed: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ManusCloudConnector {
  async sendAction(request: RemediationActionRequest, context?: ManusExecutionContext): Promise<RemediationActionResult> {
    const startedAt = Date.now();
    if (!context || context.validatedBy !== "socSafeRemediationEngine" || !context.gatePassed || !context.decisionPassed) {
      cloudExecutionAuditLogger.log({ request, status: "critical", result: { executionId: "bypass-blocked", tenantId: request.tenantId, incidentId: request.incidentId, actionType: request.actionType, status: "failed", error: "Gate bypass attempt blocked", timestamp: Date.now() } });
      throw new Error("Manus connector bypass blocked: use SOCSafeRemediationEngine execution path");
    }

    const gate = evaluateCloudActionGate(request);
    cloudExecutionAuditLogger.log({ request, status: gate.allowed ? "requested" : "blocked" });
    if (!gate.allowed) return { executionId: "gate-blocked", tenantId: request.tenantId, incidentId: request.incidentId, actionType: request.actionType, status: "failed", error: gate.reasons.join("; "), timestamp: Date.now() };

    const idempotency = manusIdempotencyKeyManager.reserve(request);
    if (!idempotency.allowed) return { executionId: idempotency.idempotencyKey, tenantId: request.tenantId, incidentId: request.incidentId, actionType: request.actionType, status: "failed", error: idempotency.reason, timestamp: Date.now() };
    const duplicate = doubleExecutionGuard.reserve(request);
    if (!duplicate.allowed) {
      manusIdempotencyKeyManager.release(idempotency.idempotencyKey);
      return { executionId: duplicate.fingerprint, tenantId: request.tenantId, incidentId: request.incidentId, actionType: request.actionType, status: "failed", error: duplicate.reason, timestamp: Date.now() };
    }

    const record = manusExecutionTracker.create(request, { idempotencyKey: idempotency.idempotencyKey, fingerprint: duplicate.fingerprint });
    manusExecutionTracker.update(record.executionId, { status: "sent", attempts: 0, cloudStatus: "sent_to_cloud" });
    let lastError: string | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      manusExecutionTracker.update(record.executionId, { status: attempt === 0 ? "sent" : "executing", attempts: attempt + 1 });
      const response = await manusApiAdapter.sendAction({ ...request, metadata: { ...(request.metadata ?? {}), idempotencyKey: idempotency.idempotencyKey } });
      if (response.ok) {
        const pending = manusExecutionTracker.update(record.executionId, { status: "pending_verification", cloudStatus: response.executionRef ?? "accepted" }) ?? record;
        manusEventSync.sync(pending);
        const confirmed = await manusConfirmationPoller.confirm(record.executionId);
        const finalRecord = confirmed ?? pending;
        recordRemediationExecutionLatency(Date.now() - startedAt);
        const result = { executionId: finalRecord.executionId, tenantId: finalRecord.tenantId, incidentId: finalRecord.incidentId, actionType: finalRecord.actionType, status: finalRecord.status, cloudStatus: finalRecord.cloudStatus, error: finalRecord.error, timestamp: Date.now() };
        cloudExecutionAuditLogger.log({ request, status: finalRecord.status === "confirmed" ? "completed" : "sent", result });
        return result;
      }
      lastError = response.error ?? "Manus request failed";
      await sleep(attempt === 0 ? 1000 : 3000);
    }

    const failed = manusExecutionTracker.update(record.executionId, { status: "pending_verification", cloudStatus: "pending_verification", error: lastError }) ?? record;
    activateFailsafeMode("Manus connector entered pending verification after retry exhaustion");
    manusEventSync.sync(failed);
    recordRemediationFailure();
    return { executionId: failed.executionId, tenantId: failed.tenantId, incidentId: failed.incidentId, actionType: failed.actionType, status: "pending_verification", cloudStatus: failed.cloudStatus, error: lastError, timestamp: Date.now() };
  }

  status() {
    return { pending: manusExecutionTracker.list("pending"), sent: manusExecutionTracker.list("sent"), executing: manusExecutionTracker.list("executing"), pendingVerification: manusExecutionTracker.list("pending_verification"), confirmed: manusExecutionTracker.list("confirmed"), failed: manusExecutionTracker.list("failed") };
  }
}

export const manusCloudConnector = new ManusCloudConnector();
