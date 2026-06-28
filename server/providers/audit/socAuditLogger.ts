import { appendFileSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { getTenantContext } from "../../platform/tenant/tenantContext";

export type SOCAuditEventType = "incident_created" | "score_changed" | "correlation_decision" | "action_suggested" | "response_generated" | "ai_operator_decision" | "storage_failed" | "replay_requested";

export interface SOCAuditEvent {
  id: string;
  type: SOCAuditEventType;
  tenantId?: string;
  incidentId?: string;
  timestamp: number;
  message: string;
  metadata?: Record<string, unknown>;
}

const auditLog: SOCAuditEvent[] = [];
const dataDir = process.env.SOC_DATA_DIR || path.resolve(process.cwd(), "data", "soc");
const auditFile = path.join(dataDir, "soc-audit.jsonl");

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function ensureDataDir(): void {
  mkdirSync(dataDir, { recursive: true });
}

export class SOCAuditLogger {
  log(type: SOCAuditEventType, message: string, incidentId?: string, metadata?: Record<string, unknown>): SOCAuditEvent {
    const timestamp = Date.now();
    const tenantId = typeof metadata?.tenantId === "string" ? metadata.tenantId : getTenantContext()?.tenantId;
    const event: SOCAuditEvent = {
      id: stableHash([tenantId ?? "system", type, incidentId ?? "system", String(timestamp), message].join("|")),
      type,
      ...(tenantId ? { tenantId } : {}),
      ...(incidentId ? { incidentId } : {}),
      timestamp,
      message,
      ...(metadata ? { metadata } : {}),
    };
    auditLog.push(event);
    try {
      ensureDataDir();
      appendFileSync(auditFile, JSON.stringify(event) + "\n", "utf8");
    } catch {
      // Audit must never block the SOC pipeline.
    }
    return event;
  }

  list(tenantId?: string): SOCAuditEvent[] {
    const inMemory = auditLog.length > 0 ? auditLog : this.readPersisted();
    return inMemory.filter((event) => !tenantId || event.tenantId === tenantId).sort((a, b) => b.timestamp - a.timestamp);
  }

  private readPersisted(): SOCAuditEvent[] {
    try {
      return readFileSync(auditFile, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as SOCAuditEvent);
    } catch {
      return [];
    }
  }
}

export const socAuditLogger = new SOCAuditLogger();
