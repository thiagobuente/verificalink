import { enterpriseAuditTrail } from "../compliance/auditTrail";
import { recordConnectorFailure, recordSiemSyncLatency } from "../observability/enterpriseMetrics";
import { incidentToSIEMEvent, type EnterpriseSOCIncident, type SIEMConnector, type SIEMEvent } from "./siemConnector";
import { normalizeExternalEvent, type EnterpriseSecurityEvent } from "../normalizer/globalNormalizer";

export interface SentinelAdapterConfig {
  workspaceId?: string;
  webhookUrl?: string;
  sharedKey?: string;
  enabled?: boolean;
}

export class SentinelAdapter implements SIEMConnector {
  readonly id = "microsoft-sentinel";
  readonly name = "Microsoft Sentinel Adapter";

  constructor(private readonly config: SentinelAdapterConfig = {}) {}

  mapIncident(incident: EnterpriseSOCIncident): SIEMEvent {
    const event = incidentToSIEMEvent(incident, this.id);
    return {
      ...event,
      payload: {
        ...event.payload,
        provider: "sentinel-like",
        workspaceId: this.config.workspaceId,
        eventType: "ShieldSecurityIncident",
      },
    };
  }

  async sendIncident(incident: EnterpriseSOCIncident): Promise<{ success: boolean; error?: string }> {
    const startedAt = Date.now();
    try {
      if (!this.config.enabled || !this.config.webhookUrl) {
        enterpriseAuditTrail.append("external_integration", "Sentinel adapter prepared event without delivery", { incidentId: incident.incidentId }, incident.tenantId);
        return { success: true };
      }
      const response = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(this.mapIncident(incident)),
      });
      recordSiemSyncLatency(this.id, Date.now() - startedAt);
      if (!response.ok) throw new Error("Sentinel webhook failed with status " + String(response.status));
      enterpriseAuditTrail.append("external_integration", "Incident sent to Sentinel adapter", { incidentId: incident.incidentId }, incident.tenantId);
      return { success: true };
    } catch (error) {
      recordConnectorFailure(this.id);
      enterpriseAuditTrail.append("connector_failure", "Sentinel adapter failed", { incidentId: incident.incidentId, error: error instanceof Error ? error.message : String(error) }, incident.tenantId);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async receiveEvents(events: SIEMEvent[]): Promise<EnterpriseSecurityEvent[]> {
    return events.map((event) => normalizeExternalEvent({ ...event, type: "sentinel" }));
  }
}
