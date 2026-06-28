import { enterpriseAuditTrail } from "../compliance/auditTrail";
import { recordConnectorFailure, recordSiemSyncLatency } from "../observability/enterpriseMetrics";
import { incidentToSIEMEvent, type EnterpriseSOCIncident, type SIEMConnector, type SIEMEvent } from "./siemConnector";
import { normalizeExternalEvent, type EnterpriseSecurityEvent } from "../normalizer/globalNormalizer";

export interface SplunkAdapterConfig {
  hecUrl?: string;
  token?: string;
  index?: string;
  sourceType?: string;
  enabled?: boolean;
}

export class SplunkAdapter implements SIEMConnector {
  readonly id = "splunk-hec";
  readonly name = "Splunk HEC Adapter";

  constructor(private readonly config: SplunkAdapterConfig = {}) {}

  mapIncident(incident: EnterpriseSOCIncident) {
    const event = incidentToSIEMEvent(incident, this.id);
    return {
      time: Math.round(event.timestamp / 1000),
      host: "shield-security-scanner",
      source: event.source,
      sourcetype: this.config.sourceType ?? "shield:incident",
      index: this.config.index,
      event: event.payload,
      fields: {
        tenantId: event.tenantId,
        severity: event.severity,
        incidentId: incident.incidentId,
      },
    };
  }

  async sendIncident(incident: EnterpriseSOCIncident): Promise<{ success: boolean; error?: string }> {
    const startedAt = Date.now();
    try {
      if (!this.config.enabled || !this.config.hecUrl || !this.config.token) {
        enterpriseAuditTrail.append("external_integration", "Splunk adapter prepared HEC event without delivery", { incidentId: incident.incidentId }, incident.tenantId);
        return { success: true };
      }
      const response = await fetch(this.config.hecUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Splunk " + this.config.token,
        },
        body: JSON.stringify(this.mapIncident(incident)),
      });
      recordSiemSyncLatency(this.id, Date.now() - startedAt);
      if (!response.ok) throw new Error("Splunk HEC failed with status " + String(response.status));
      enterpriseAuditTrail.append("external_integration", "Incident sent to Splunk HEC", { incidentId: incident.incidentId }, incident.tenantId);
      return { success: true };
    } catch (error) {
      recordConnectorFailure(this.id);
      enterpriseAuditTrail.append("connector_failure", "Splunk adapter failed", { incidentId: incident.incidentId, error: error instanceof Error ? error.message : String(error) }, incident.tenantId);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async receiveEvents(events: SIEMEvent[]): Promise<EnterpriseSecurityEvent[]> {
    return events.map((event) => normalizeExternalEvent({ ...event, type: "splunk" }));
  }
}
