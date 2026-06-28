export type SOCIncidentLifecycleState = "detected" | "enriched" | "correlated" | "investigating" | "resolved" | "archived";

export interface SOCIncidentLifecycleEvent {
  incidentId: string;
  from?: SOCIncidentLifecycleState;
  to: SOCIncidentLifecycleState;
  timestamp: number;
  reason: string;
}

const allowed: Record<SOCIncidentLifecycleState, SOCIncidentLifecycleState[]> = {
  detected: ["enriched", "correlated"],
  enriched: ["correlated", "investigating"],
  correlated: ["investigating", "resolved"],
  investigating: ["resolved"],
  resolved: ["archived"],
  archived: [],
};
const states = new Map<string, SOCIncidentLifecycleState>();
const logs: SOCIncidentLifecycleEvent[] = [];

export class SOCIncidentLifecycleEngine {
  transition(incidentId: string, to: SOCIncidentLifecycleState, reason: string): SOCIncidentLifecycleEvent {
    const from = states.get(incidentId);
    if (from && !allowed[from].includes(to)) throw new Error("Invalid incident transition " + from + " -> " + to);
    states.set(incidentId, to);
    const event = { incidentId, from, to, timestamp: Date.now(), reason };
    logs.push(event);
    return event;
  }

  getState(incidentId: string): SOCIncidentLifecycleState | undefined {
    return states.get(incidentId);
  }

  listEvents(incidentId?: string): SOCIncidentLifecycleEvent[] {
    return logs.filter((event) => !incidentId || event.incidentId === incidentId).sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const socIncidentLifecycleEngine = new SOCIncidentLifecycleEngine();
