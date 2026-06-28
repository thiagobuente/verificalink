export type RemediationState = "detected" | "validated" | "approved" | "sent_to_cloud" | "executing" | "completed" | "failed" | "rolled_back";

const transitions: Record<RemediationState, RemediationState[]> = {
  detected: ["validated", "failed"],
  validated: ["approved", "failed"],
  approved: ["sent_to_cloud", "failed"],
  sent_to_cloud: ["executing", "failed"],
  executing: ["completed", "failed", "rolled_back"],
  completed: ["rolled_back"],
  failed: ["rolled_back"],
  rolled_back: [],
};

export interface RemediationStateRecord {
  executionId: string;
  incidentId: string;
  state: RemediationState;
  history: Array<{ state: RemediationState; timestamp: number; reason?: string }>;
}

const states = new Map<string, RemediationStateRecord>();
const stateLocks = new Set<string>();

function incidentFromExecutionId(executionId: string): string {
  const parts = executionId.split(":");
  return parts.length >= 2 ? parts[1] : executionId;
}

export class RemediationStateMachine {
  start(executionId: string, incidentId = incidentFromExecutionId(executionId)): RemediationStateRecord {
    const existing = states.get(executionId);
    if (existing) return existing;
    const record = { executionId, incidentId, state: "detected" as const, history: [{ state: "detected" as const, timestamp: Date.now() }] };
    states.set(executionId, record);
    return record;
  }

  transition(executionId: string, nextState: RemediationState, reason?: string): RemediationStateRecord | undefined {
    const record = states.get(executionId) ?? this.start(executionId);
    if (stateLocks.has(record.incidentId)) return record;
    stateLocks.add(record.incidentId);
    try {
      if (!transitions[record.state].includes(nextState)) return record;
      const updated = { ...record, state: nextState, history: [...record.history, { state: nextState, timestamp: Date.now(), reason }] };
      states.set(executionId, updated);
      return updated;
    } finally {
      stateLocks.delete(record.incidentId);
    }
  }

  list(): RemediationStateRecord[] {
    return [...states.values()].slice().reverse();
  }

  locks() {
    return [...stateLocks];
  }
}

export const remediationStateMachine = new RemediationStateMachine();
