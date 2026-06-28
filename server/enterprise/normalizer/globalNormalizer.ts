import type { SecurityEvent } from "../../providers/correlation/correlationEngine";
import type { IocType } from "../../providers/interfaces/provider";

export interface EnterpriseSecurityEvent extends SecurityEvent {
  tenantId: string;
  rawSourceType: string;
}

export interface ExternalRawEvent {
  tenantId: string;
  source: string;
  timestamp?: number | string;
  payload: unknown;
  severity?: string | number;
  type?: string;
}

function stableHash(parts: string[]): string {
  let hash = 2166136261;
  const input = parts.join("|");
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function textFromPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function severityNumber(severity: string | number | undefined): number {
  if (typeof severity === "number") return Math.max(0, Math.min(100, severity));
  if (!severity) return 25;
  if (/critical/i.test(severity)) return 90;
  if (/high/i.test(severity)) return 75;
  if (/medium|moderate/i.test(severity)) return 50;
  if (/low|info/i.test(severity)) return 20;
  return 35;
}

function inferValue(payloadText: string): string {
  const ip = payloadText.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (ip) return ip[0];
  const url = payloadText.match(/https?:\/\/[^\s"']+/i);
  if (url) return url[0];
  const hash = payloadText.match(/\b[a-f0-9]{32,64}\b/i);
  if (hash) return hash[0];
  const domain = payloadText.match(/\b[a-z0-9.-]+\.[a-z]{2,}\b/i);
  return domain?.[0] ?? "external-event";
}

function inferType(value: string): IocType {
  if (/^https?:\/\//i.test(value)) return "url";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return "ip";
  if (/^[a-f0-9]{32,64}$/i.test(value)) return "hash";
  if (/^[^@\s]+@[^@\s]+$/.test(value)) return "email";
  if (value.includes(".")) return "domain";
  return "unknown";
}

function eventType(value: string, payloadText: string): SecurityEvent["type"] {
  if (/malware|trojan|ransom|payload/i.test(payloadText)) return "malware";
  if (/scan|probe|recon/i.test(payloadText)) return "scan";
  if (/port|exposure|public|cloud/i.test(payloadText)) return "exposure";
  if (/reputation|abuse|deny|block/i.test(payloadText)) return "reputation";
  return inferType(value) === "unknown" ? "ioc" : "ioc";
}

export function normalizeExternalEvent(input: ExternalRawEvent): EnterpriseSecurityEvent {
  const payloadText = textFromPayload(input.payload);
  const value = inferValue(payloadText);
  const timestamp = typeof input.timestamp === "string" ? Date.parse(input.timestamp) : input.timestamp ?? Date.now();
  const severity = severityNumber(input.severity);
  return {
    tenantId: input.tenantId,
    rawSourceType: input.type ?? input.source,
    id: stableHash([input.tenantId, input.source, value, String(timestamp), payloadText.slice(0, 120)]),
    type: eventType(value, payloadText),
    source: input.source,
    value,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    severity,
    tags: [input.source, input.type ?? "external"].filter(Boolean),
  };
}
