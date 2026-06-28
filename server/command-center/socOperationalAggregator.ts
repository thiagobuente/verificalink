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
  providerStatus?: unknown[];
  aggregateScore?: number;
  correlatedIocs?: string[];
  recentEvents?: unknown[];
}

export function buildSOCOperationalView(tenantId: string): SOCOperationalView & { events: unknown[]; alerts: unknown[]; defense: unknown } {
  const incidents = incidentStore.summarize(tenantId, 1000);
  const events = listSOCEvents(tenantId, 100);
  const providerStatus = iocAggregator.getHealth();
  const aggregateScore = incidents.length > 0
    ? Math.round(incidents.reduce((sum, incident) => sum + Number(incident.scoring?.threatScore ?? incident.ioc?.riskScore ?? 0), 0) / incidents.length)
    : 0;
  const correlatedIocs = [...new Set(incidents.flatMap((incident) => [incident.ioc?.value, ...(incident.correlation?.relatedCluster ?? [])]).filter(Boolean) as string[])].slice(0, 50);

  return rememberCommandFeed({
    activeIncidents: incidents.filter((incident) => incident.incidentId).slice(0, 100),
    activeCampaigns: threatNetwork.getFeed().campaigns,
    systemHealth: buildSOCSystemHealth(providerStatus),
    aiInsights: incidents.map((incident) => incident.aiOperator).filter(Boolean),
    automationStatus: limitedResponseEngine.status(tenantId),
    providerStatus,
    aggregateScore,
    correlatedIocs,
    recentEvents: events.slice(0, 25),
    events,
    alerts: buildRealTimeAlerts(events),
    defense: defenseCoordinator.buildFeed(),
  }) as unknown as SOCOperationalView & { events: unknown[]; alerts: unknown[]; defense: unknown };
}
