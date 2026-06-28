import { activateFailsafeMode } from "../../autonomous/safety/socGlobalSafetyRules";
import { recordRemediationFailure } from "../../observability/remediationMetrics";
import { manusEventSync } from "./manusEventSync";
import { manusExecutionTracker, type ManusExecutionRecord } from "./manusExecutionTracker";

export interface ManusCloudStatus {
  confirmed: boolean;
  failed: boolean;
  status: string;
}

export class ManusConfirmationPoller {
  async fetchCloudStatus(record: ManusExecutionRecord): Promise<ManusCloudStatus> {
    if (record.cloudStatus === "manus-simulated" || record.cloudStatus === "accepted") return { confirmed: true, failed: false, status: "confirmed" };
    if (record.error) return { confirmed: false, failed: true, status: record.error };
    return { confirmed: false, failed: false, status: "pending_verification" };
  }

  async confirm(executionId: string): Promise<ManusExecutionRecord | undefined> {
    const record = manusExecutionTracker.list().find((item) => item.executionId === executionId);
    if (!record) return undefined;
    const status = await this.fetchCloudStatus(record);
    const updated = status.confirmed
      ? manusExecutionTracker.confirm(executionId, status.status)
      : manusExecutionTracker.update(executionId, { status: status.failed ? "failed" : "pending_verification", cloudStatus: status.status, error: status.failed ? status.status : undefined });
    if (updated) manusEventSync.sync(updated);
    if (status.failed) recordRemediationFailure();
    return updated;
  }

  async pollPending(): Promise<ManusExecutionRecord[]> {
    const pending = manusExecutionTracker.list().filter((record) => ["sent", "executing", "pending_verification"].includes(record.status));
    const updates: ManusExecutionRecord[] = [];
    for (const record of pending) {
      const updated = await this.confirm(record.executionId);
      if (updated) updates.push(updated);
    }
    return updates;
  }

  failSafe(reason: string): void {
    activateFailsafeMode(reason);
  }
}

export const manusConfirmationPoller = new ManusConfirmationPoller();
