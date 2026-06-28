import { enterpriseAuditTrail } from "../compliance/auditTrail";
import { recordConnectorFailure, recordSiemSyncLatency } from "../observability/enterpriseMetrics";
import { normalizeExternalEvent, type EnterpriseSecurityEvent } from "../normalizer/globalNormalizer";

export interface EnterpriseSOCIncident {
  tenantId: string;
  incidentId: string;
  timestamp: number;
  ioc?: any;
  scoring?: any;
  correlation?: any;
  actions?: any;
  responses?: any;
  aiOperator?: any;
}

export interface SIEMEvent {
  source: string;
  timestamp: number;
  payload: any;
  severity: string;
  tenantId: string;
}

export interface SIEMConnector {
  id: string;
  name: string;
  sendIncident(incident: EnterpriseSOCIncident): Promise<{ success: boolean; error?: string }>;
  receiveEvents(events: SIEMEvent[]): Promise<EnterpriseSecurityEvent[]>;
}

export interface SIEMConnectorConfig {
  id: string;
  name: string;
  endpoint?: string;
  token?: string;
  enabled?: boolean;
}

export function incidentToSIEMEvent(incident: EnterpriseSOCIncident, source = "shield-security"): SIEMEvent {
  return {
    source,
    timestamp: incident.timestamp,
    tenantId: incident.tenantId,
    severity: incident.scoring?.riskLevel ?? incident.ioc?.reputation ?? "unknown",
    payload: {
      incidentId: incident.incidentId,
      tenantId: incident.tenantId,
      ioc: incident.ioc?.value,
      type: incident.ioc?.type,
      riskScore: incident.ioc?.riskScore,
      threatScore: incident.scoring?.threatScore,
      correlationScore: incident.correlation?.correlationScore,
      actions: incident.actions,
      responses: incident.responses,
      aiOperator: incident.aiOperator,
    },
  };
}

export class GenericSIEMConnector implements SIEMConnector {
  readonly id: string;
  readonly name: string;

  constructor(private readonly config: SIEMConnectorConfig) {
    this.id = config.id;
    this.name = config.name;
  }

  async sendIncident(incident: EnterpriseSOCIncident): Promise<{ success: boolean; error?: string }> {
    const startedAt = Date.now();
    try {
      if (!this.config.enabled || !this.config.endpoint) {
        enterpriseAuditTrail.append("external_integration", "SIEM connector skipped because endpoint is not configured", { connectorId: this.id }, incident.tenantId);
        return { success: true };
      }
      const event = incidentToSIEMEvent(incident, this.id);
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.config.token ? { authorization: "Bearer " + this.config.token } : {}),
        },
        body: JSON.stringify(event),
      });
      recordSiemSyncLatency(this.id, Date.now() - startedAt);
      if (!response.ok) throw new Error("SIEM rejected event with status " + String(response.status));
      enterpriseAuditTrail.append("external_integration", "Incident sent to SIEM", { connectorId: this.id, incidentId: incident.incidentId }, incident.tenantId);
      return { success: true };
    } catch (error) {
      recordConnectorFailure(this.id);
      enterpriseAuditTrail.append("connector_failure", "SIEM connector failed", { connectorId: this.id, error: error instanceof Error ? error.message : String(error) }, incident.tenantId);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async receiveEvents(events: SIEMEvent[]): Promise<EnterpriseSecurityEvent[]> {
    return events.map((event) => normalizeExternalEvent({
      tenantId: event.tenantId,
      source: event.source,
      timestamp: event.timestamp,
      payload: event.payload,
      severity: event.severity,
      type: "siem",
    }));
  }
}
