import { cloudExecutionAuditLogger } from "../audit/cloudExecutionAuditLogger";
import { recordRollback } from "../../observability/remediationMetrics";
import type { RemediationActionRequest } from "./remediationTypes";

export interface RollbackRecord {
  rollbackId: string;
  executionId: string;
  incidentId: string;
  actionType: string;
  status: "prepared" | "sent" | "failed";
  steps: string[];
  timestamp: number;
}

const rollbacks: RollbackRecord[] = [];

export class SOCRollbackEngine {
  prepare(input: { executionId: string; request: RemediationActionRequest }): RollbackRecord {
    const steps = input.request.actionType === "BLOCK_IP" ? ["Prepare unblock IP request"] : input.request.actionType === "BLOCK_DOMAIN" ? ["Prepare unblock domain request"] : input.request.actionType === "QUARANTINE_ALERT" ? ["Prepare quarantine revert request"] : ["Revert safe remediation state"];
    const record = { rollbackId: "rollback:" + input.executionId, executionId: input.executionId, incidentId: input.request.incidentId, actionType: input.request.actionType, status: "prepared" as const, steps, timestamp: Date.now() };
    rollbacks.push(record);
    recordRollback();
    cloudExecutionAuditLogger.log({ request: input.request, status: "rollback", result: { executionId: input.executionId, tenantId: input.request.tenantId, incidentId: input.request.incidentId, actionType: input.request.actionType, status: "pending_verification", cloudStatus: "rollback_prepared", timestamp: Date.now() } });
    return record;
  }

  list(): RollbackRecord[] {
    return rollbacks.slice().reverse();
  }
}

export const socRollbackEngine = new SOCRollbackEngine();
