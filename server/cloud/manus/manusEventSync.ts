import { recordCloudSyncDelay } from "../../observability/remediationMetrics";
import { publishSOCBusEvent } from "../../events/socEventBus";
import type { ManusExecutionRecord } from "./manusExecutionTracker";

const offlineBuffer: ManusExecutionRecord[] = [];
const lastTimestampByExecution = new Map<string, number>();

function payload(record: ManusExecutionRecord) {
  return {
    executionId: record.executionId,
    incidentId: record.incidentId,
    actionType: record.actionType,
    status: record.status,
    cloudStatus: record.cloudStatus,
    timestamp: record.updatedAt,
  };
}

export class ManusEventSync {
  sync(record: ManusExecutionRecord): void {
    const last = lastTimestampByExecution.get(record.executionId) ?? 0;
    if (record.updatedAt < last) return;
    lastTimestampByExecution.set(record.executionId, record.updatedAt);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        publishSOCBusEvent("ACTION_EXECUTED", record.tenantId, payload(record));
        recordCloudSyncDelay(Date.now() - record.updatedAt);
        return;
      } catch {
        // retry below
      }
    }
    offlineBuffer.push(record);
    if (offlineBuffer.length > 500) offlineBuffer.shift();
  }

  flush(): number {
    const pending = offlineBuffer.splice(0, offlineBuffer.length);
    for (const record of pending) this.sync(record);
    return pending.length;
  }

  status() {
    return { buffered: offlineBuffer.length, lastTimestamps: [...lastTimestampByExecution.entries()] };
  }
}

export const manusEventSync = new ManusEventSync();
