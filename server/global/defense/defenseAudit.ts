import { appendFileSync, mkdirSync, readFileSync } from "fs";
import path from "path";

export type DefenseAuditEventType = "recommendation_generated" | "recommendation_propagated" | "posture_changed";

export interface DefenseAuditEvent {
  id: string;
  type: DefenseAuditEventType;
  timestamp: number;
  message: string;
  metadata?: Record<string, unknown>;
}

const events: DefenseAuditEvent[] = [];
const dataDir = process.env.SOC_DATA_DIR || path.resolve(process.cwd(), "data", "soc");
const auditFile = path.join(dataDir, "global-defense-audit.jsonl");

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export class DefenseAuditLogger {
  log(type: DefenseAuditEventType, message: string, metadata?: Record<string, unknown>): DefenseAuditEvent {
    const timestamp = Date.now();
    const event: DefenseAuditEvent = {
      id: stableHash([type, String(timestamp), message].join("|")),
      type,
      timestamp,
      message,
      ...(metadata ? { metadata } : {}),
    };
    events.push(event);
    try {
      mkdirSync(dataDir, { recursive: true });
      appendFileSync(auditFile, JSON.stringify(event) + "\n", "utf8");
    } catch {
      // Defense logging is append-only best effort and never blocks recommendations.
    }
    return event;
  }

  list(): DefenseAuditEvent[] {
    const loaded = events.length > 0 ? events : this.readPersisted();
    return loaded.sort((a, b) => b.timestamp - a.timestamp);
  }

  private readPersisted(): DefenseAuditEvent[] {
    try {
      return readFileSync(auditFile, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as DefenseAuditEvent);
    } catch {
      return [];
    }
  }
}

export const defenseAuditLogger = new DefenseAuditLogger();
