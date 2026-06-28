import type { HealingAuditEvent } from "./selfHealingTypes";

const events: HealingAuditEvent[] = [];

export class HealingAuditLogger {
  log(event: Omit<HealingAuditEvent, "id" | "timestamp">): HealingAuditEvent {
    const record = { ...event, id: [event.action, Date.now()].join(":"), timestamp: Date.now() };
    events.push(record);
    if (events.length > 1000) events.shift();
    return record;
  }

  list(limit = 100): HealingAuditEvent[] {
    return events.slice(-limit).reverse();
  }
}

export const healingAuditLogger = new HealingAuditLogger();
