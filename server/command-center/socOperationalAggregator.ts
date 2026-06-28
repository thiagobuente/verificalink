import { defenseCoordinator } from "../global";
import { limitedResponseEngine } from "../global/autonomous/limitedResponseEngine";
import { threatNetwork } from "../global/intelligence/threatNetwork";
import { incidentStore } from "../providers/storage/incidentStore";
import { iocAggregator } from "../providers/aggregator/iocAggregator";
import { buildSOCSystemHealth } from "./socHealthMonitor";
import { buildRealTimeAlerts } from "./realTimeAlertEngine";
import { rememberCommandFeed } from "./commandCenterNormalizer";
import { listSOCEvents } from "./socEventStream";

export interface SOCOperationalView {
  activeIncidents: unknown[];
  activeCampaigns: unknown[];
  systemHealth: unknown;
  aiInsights: unknown[];
  automationStatus: unknown;
}

export function buildSOCOperationalView(tenantId: string): SOCOperationalView & { events: unknown[]; alerts: unknown[]; defense: any } {
  const incidents = incidentStore.summarize(tenantId, 1000);
  const events = listSOCEvents(tenantId, 100);
  return rememberCommandFeed({
    activeIncidents: incidents.filter((incident) => incident.incidentId).slice(0, 100),
    activeCampaigns: threatNetwork.getFeed().campaigns,
    systemHealth: buildSOCSystemHealth(iocAggregator.getHealth()),
    aiInsights: incidents.map((incident) => incident.aiOperator).filter(Boolean),
    automationStatus: limitedResponseEngine.status(tenantId),
    events,
    alerts: buildRealTimeAlerts(events),
    defense: defenseCoordinator.buildFeed(),
  }) as unknown as SOCOperationalView & { events: unknown[]; alerts: unknown[]; defense: unknown };
}
