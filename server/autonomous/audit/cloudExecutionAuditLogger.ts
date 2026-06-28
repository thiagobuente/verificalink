import type { RemediationActionRequest, RemediationActionResult } from "../remediation/remediationTypes";

export interface CloudExecutionAuditEvent {
  id: string;
  timestamp: number;
  actor: string;
  tenantId: string;
  incidentId: string;
  actionType: string;
  rationale: string[];
  inputIoc?: string;
  result?: RemediationActionResult;
  status: "requested" | "sent" | "completed" | "failed" | "rollback" | "blocked" | "critical";
  count?: number;
}

const events: CloudExecutionAuditEvent[] = [];
let buffer: CloudExecutionAuditEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

function signature(event: CloudExecutionAuditEvent): string {
  return [event.tenantId, event.incidentId, event.actionType, event.status, event.result?.error ?? ""].join("|");
}

function flush(): void {
  const grouped = new Map<string, CloudExecutionAuditEvent>();
  for (const event of buffer) {
    const key = signature(event);
    const existing = grouped.get(key);
    grouped.set(key, existing ? { ...existing, count: (existing.count ?? 1) + 1, timestamp: event.timestamp } : event);
  }
  events.push(...grouped.values());
  buffer = [];
  if (events.length > 2000) events.splice(0, events.length - 2000);
  timer = undefined;
}

export class CloudExecutionAuditLogger {
  log(input: { request: RemediationActionRequest; status: CloudExecutionAuditEvent["status"]; result?: RemediationActionResult }): CloudExecutionAuditEvent {
    const event = {
      id: [input.request.tenantId, input.request.incidentId, input.request.actionType, Date.now()].join(":"),
      timestamp: Date.now(),
      actor: input.request.requestedBy,
      tenantId: input.request.tenantId,
      incidentId: input.request.incidentId,
      actionType: input.request.actionType,
      rationale: input.request.rationale,
      inputIoc: input.request.ioc,
      result: input.result,
      status: input.status,
      count: 1,
    };
    buffer.push(event);
    if (!timer) timer = setTimeout(flush, 1500);
    return event;
  }

  flush(): void {
    if (timer) clearTimeout(timer);
    flush();
  }

  list(tenantId?: string): CloudExecutionAuditEvent[] {
    this.flush();
    return events.filter((event) => !tenantId || event.tenantId === tenantId).slice().reverse();
  }
}

export const cloudExecutionAuditLogger = new CloudExecutionAuditLogger();
