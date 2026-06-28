import type { StoredIncident } from "../../providers/storage/incidentStore";
import { enterpriseAuditTrail } from "../compliance/auditTrail";
import { recordExportUsage } from "../observability/enterpriseMetrics";
import { incidentToSIEMEvent } from "../connectors/siemConnector";

export type SOCExportFormat = "json" | "csv" | "siem";

export interface SOCExportRequest {
  tenantId: string;
  format: SOCExportFormat;
  incidents: StoredIncident[];
  from?: number;
  to?: number;
  incidentId?: string;
}

function filterIncidents(request: SOCExportRequest): StoredIncident[] {
  return request.incidents.filter((incident) => incident.tenantId === request.tenantId)
    .filter((incident) => !request.incidentId || incident.incidentId === request.incidentId)
    .filter((incident) => !request.from || incident.timestamp >= request.from)
    .filter((incident) => !request.to || incident.timestamp <= request.to);
}

function csvEscape(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

export class SOCExportEngine {
  export(request: SOCExportRequest): string {
    const incidents = filterIncidents(request);
    recordExportUsage(request.tenantId);
    enterpriseAuditTrail.append("export_generated", "SOC export generated", { format: request.format, count: incidents.length }, request.tenantId);
    if (request.format === "siem") return JSON.stringify(incidents.map((incident) => incidentToSIEMEvent(incident)), null, 2);
    if (request.format === "csv") {
      const rows = [["tenantId", "incidentId", "timestamp", "ioc", "riskScore", "threatScore", "correlationScore", "priority"]];
      rows.push(...incidents.map((incident) => [
        incident.tenantId,
        incident.incidentId,
        String(incident.timestamp),
        String(incident.ioc?.value ?? ""),
        String(incident.ioc?.riskScore ?? ""),
        String(incident.scoring?.threatScore ?? ""),
        String(incident.correlation?.correlationScore ?? ""),
        String(incident.aiOperator?.adjustedPriority ?? incident.scoring?.riskLevel ?? ""),
      ]));
      return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    }
    return JSON.stringify(incidents, null, 2);
  }
}

export const socExportEngine = new SOCExportEngine();
