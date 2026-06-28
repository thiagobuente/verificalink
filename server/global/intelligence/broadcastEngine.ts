import type { GlobalCampaign } from "./campaignDetector";
import type { SharedThreatSignal } from "./threatNetwork";

export interface GlobalThreatAlert {
  alertId: string;
  tenantAudience: string;
  patternType: string;
  severity: number;
  confidence: number;
  summary: string;
  relatedSignalCount: number;
  timestamp: number;
}

function alertId(campaign: GlobalCampaign, tenantAudience: string): string {
  return [campaign.campaignId, tenantAudience].join(":");
}

export function buildBroadcastAlerts(campaigns: GlobalCampaign[], signals: SharedThreatSignal[]): GlobalThreatAlert[] {
  const audiences = [...new Set(signals.map((signal) => signal.sourceTenant))];
  return campaigns.flatMap((campaign) => audiences.map((tenantAudience) => ({
    alertId: alertId(campaign, tenantAudience),
    tenantAudience,
    patternType: campaign.patternType,
    severity: campaign.severity,
    confidence: campaign.confidence,
    summary: "Global anonymized threat pattern detected across the intelligence network",
    relatedSignalCount: campaign.relatedSignals.length,
    timestamp: campaign.lastSeen,
  }))).sort((a, b) => b.severity - a.severity);
}
