import { appendFileSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { getTenantContext } from "../../platform/tenant/tenantContext";

export type EnterpriseAuditEventType = "incident_access" | "ai_decision" | "soc_action" | "external_integration" | "connector_failure" | "export_generated" | "external_ingestion";

export interface EnterpriseAuditEvent {
  id: string;
  tenantId: string;
  type: EnterpriseAuditEventType;
  timestamp: number;
  actor?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const events: EnterpriseAuditEvent[] = [];
const dataDir = process.env.SOC_DATA_DIR || path.resolve(process.cwd(), "data", "soc");
const auditFile = path.join(dataDir, "enterprise-audit.jsonl");

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

export class EnterpriseAuditTrail {
  append(type: EnterpriseAuditEventType, message: string, metadata?: Record<string, unknown>, tenantId = getTenantContext()?.tenantId ?? "unknown"): EnterpriseAuditEvent {
    const timestamp = Date.now();
    const event: EnterpriseAuditEvent = {
      id: stableHash([tenantId, type, String(timestamp), message].join("|")),
      tenantId,
      type,
      timestamp,
      actor: getTenantContext()?.role,
      message,
      ...(metadata ? { metadata } : {}),
    };
    events.push(event);
    try {
      ensureDataDir();
      appendFileSync(auditFile, JSON.stringify(event) + "\n", "utf8");
    } catch {
      // Compliance logging must not interrupt core processing.
    }
    return event;
  }

  list(tenantId: string): EnterpriseAuditEvent[] {
    const loaded = events.length > 0 ? events : this.readPersisted();
    return loaded.filter((event) => event.tenantId === tenantId).sort((a, b) => b.timestamp - a.timestamp);
  }

  private readPersisted(): EnterpriseAuditEvent[] {
    try {
      return readFileSync(auditFile, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as EnterpriseAuditEvent);
    } catch {
      return [];
    }
  }
}

export const enterpriseAuditTrail = new EnterpriseAuditTrail();
