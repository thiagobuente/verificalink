import type { AutonomousActionRecord } from "./autonomousModels";

const audit: AutonomousActionRecord[] = [];

export class AutonomousAuditLogger {
  log(record: AutonomousActionRecord): void {
    audit.push(record);
    if (audit.length > 1000) audit.shift();
  }

  list(tenantId?: string): AutonomousActionRecord[] {
    return audit.filter((item) => !tenantId || item.tenantId === tenantId).sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const autonomousAuditLogger = new AutonomousAuditLogger();
