export interface SOARAuditEvent {
  id: string;
  timestamp: number;
  incidentId: string;
  action: string;
  decision: string;
  approved: boolean;
  rationale: string[];
}

const events: SOARAuditEvent[] = [];

export class SOCSOARAuditLogger {
  log(event: Omit<SOARAuditEvent, "id" | "timestamp">): SOARAuditEvent {
    const record = { ...event, id: [event.incidentId, event.action, Date.now()].join(":"), timestamp: Date.now() };
    events.push(record);
    if (events.length > 1000) events.shift();
    return record;
  }

  list(incidentId?: string): SOARAuditEvent[] {
    return events.filter((event) => !incidentId || event.incidentId === incidentId).slice().reverse();
  }
}

export const socSOARAuditLogger = new SOCSOARAuditLogger();
