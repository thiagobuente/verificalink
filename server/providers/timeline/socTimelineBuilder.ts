import type { StoredIncident } from "../storage/incidentStore";

export interface SOCTimelineEvent {
  id: string;
  incidentId: string;
  timestamp: number;
  type: "ioc_detection" | "scoring_change" | "correlation_event" | "incident_creation" | "narrative_update" | "action" | "response" | "ai_operator_insight";
  summary: string;
  severity?: string;
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

function event(incidentId: string, timestamp: number, type: SOCTimelineEvent["type"], summary: string, severity?: string): SOCTimelineEvent {
  return {
    id: stableHash([incidentId, String(timestamp), type, summary]),
    incidentId,
    timestamp,
    type,
    summary,
    ...(severity ? { severity } : {}),
  };
}

export class SOCTimelineBuilder {
  build(incidents: StoredIncident[]): SOCTimelineEvent[] {
    return incidents.flatMap((incident) => [
      event(incident.incidentId, incident.timestamp, "incident_creation", "Incident persisted for " + String(incident.ioc.value), incident.scoring?.riskLevel),
      event(incident.incidentId, incident.timestamp, "ioc_detection", "IOC detection recorded", incident.ioc.reputation),
      incident.scoring?.threatScore !== undefined ? event(incident.incidentId, incident.timestamp, "scoring_change", "Threat score evaluated at " + String(incident.scoring.threatScore), incident.scoring.riskLevel) : undefined,
      incident.correlation?.correlationScore !== undefined ? event(incident.incidentId, incident.timestamp, "correlation_event", "Correlation score evaluated at " + String(incident.correlation.correlationScore)) : undefined,
      incident.narrative ? event(incident.incidentId, incident.timestamp, "narrative_update", incident.narrative.title ?? "Narrative generated") : undefined,
      ...(incident.actions ?? []).map((action: { actionType?: string; priority?: string }) => event(incident.incidentId, incident.timestamp, "action", "SOC action suggested: " + String(action.actionType ?? "unknown"), action.priority)),
      ...(incident.responses ?? []).map((response: { responseType?: string; priority?: string }) => event(incident.incidentId, incident.timestamp, "response", "SOC response generated: " + String(response.responseType ?? "unknown"), response.priority)),
      incident.aiOperator ? event(incident.incidentId, incident.timestamp, "ai_operator_insight", incident.aiOperator.contextSummary, incident.aiOperator.adjustedPriority) : undefined,
    ].filter(Boolean) as SOCTimelineEvent[]).sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const socTimelineBuilder = new SOCTimelineBuilder();
