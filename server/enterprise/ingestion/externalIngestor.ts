import type { IocQuery } from "../../providers/interfaces/provider";
import { enterpriseAuditTrail } from "../compliance/auditTrail";
import { recordExternalIngestion } from "../observability/enterpriseMetrics";
import { normalizeExternalEvent, type EnterpriseSecurityEvent, type ExternalRawEvent } from "../normalizer/globalNormalizer";

export interface ExternalIngestionResult {
  tenantId: string;
  events: EnterpriseSecurityEvent[];
  iocs: IocQuery[];
}

function iocType(value: string): IocQuery["type"] {
  if (/^https?:\/\//i.test(value)) return "url";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return "ip";
  if (/^[a-f0-9]{32,64}$/i.test(value)) return "hash";
  if (/^[^@\s]+@[^@\s]+$/.test(value)) return "email";
  if (value.includes(".")) return "domain";
  return "unknown";
}

export class ExternalIngestor {
  ingest(tenantId: string, rawEvents: Array<Omit<ExternalRawEvent, "tenantId">>): ExternalIngestionResult {
    const events = rawEvents.map((event) => normalizeExternalEvent({ ...event, tenantId }));
    const iocs = events.map((event) => ({ tenantId, value: event.value, type: iocType(event.value) }));
    recordExternalIngestion(tenantId);
    enterpriseAuditTrail.append("external_ingestion", "External events ingested and normalized", { count: events.length }, tenantId);
    return { tenantId, events, iocs };
  }
}

export const externalIngestor = new ExternalIngestor();
