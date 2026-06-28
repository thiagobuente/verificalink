import { remediationStateMachine } from "../../autonomous/remediation/remediationStateMachine";
import { activateFailsafeMode } from "../../autonomous/safety/socGlobalSafetyRules";
import { manusConfirmationPoller } from "./manusConfirmationPoller";
import { manusExecutionTracker } from "./manusExecutionTracker";

export interface ManusReconciliationResult {
  checked: number;
  reconciled: number;
  divergences: string[];
}

export class ManusReconciliationEngine {
  async reconcile(): Promise<ManusReconciliationResult> {
    const records = manusExecutionTracker.list();
    const divergences: string[] = [];
    let reconciled = 0;
    for (const record of records) {
      const localExecuting = ["sent", "executing", "pending_verification"].includes(record.status);
      if (!localExecuting) continue;
      const before = record.status;
      const updated = await manusConfirmationPoller.confirm(record.executionId);
      if (updated && updated.status !== before) {
        reconciled += 1;
        divergences.push(record.executionId + ":" + before + "->" + updated.status);
        if (updated.status === "confirmed") remediationStateMachine.transition(record.executionId, "completed", "Reconciled with Manus confirmed status");
        if (updated.status === "failed") remediationStateMachine.transition(record.executionId, "failed", "Reconciled with Manus failed status");
      }
    }
    if (divergences.length > 10) activateFailsafeMode("Reconciliation detected repeated cloud/local divergence");
    return { checked: records.length, reconciled, divergences };
  }
}

export const manusReconciliationEngine = new ManusReconciliationEngine();
