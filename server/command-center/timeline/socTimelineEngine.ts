export type SOCTimelineEventType = "ioc" | "correlation" | "intelligence" | "action" | "automation" | "ai";

export interface SOCIncidentTimelineItem {
  incidentId: string;
  timestamp: number;
  type: SOCTimelineEventType;
  summary: string;
  severity?: string;
  source?: string;
}

interface TimelineSource {
  incidentId?: string;
  timestamp?: number;
  ioc?: { value?: string; type?: string; riskScore?: number; providerCount?: number };
  scoring?: { threatScore?: number; riskLevel?: string; explanation?: string[] };
  correlation?: { correlationScore?: number; correlationExplanation?: string[]; timeline?: Array<{ timestamp?: number; summary?: string; severity?: number; sources?: string[] }> };
  attackIntelligence?: { summary?: string; confidence?: number; severityNarrative?: string; timelineSummary?: string[] };
  narrative?: { title?: string; summary?: string; attackFlow?: string[]; evidence?: string[]; confidence?: number };
  actions?: Array<{ actionType?: string; priority?: string; confidence?: number; rationale?: string[] }>;
  responses?: Array<{ responseType?: string; priority?: string; confidence?: number; requiresApproval?: boolean }>;
  orchestration?: Array<{ playbookId?: string; status?: string; actionType?: string; timestamp?: number }>;
  aiOperator?: { contextSummary?: string; adjustedPriority?: string; riskReevaluation?: number; confidence?: number };
}

function pushUnique(events: SOCIncidentTimelineItem[], event: SOCIncidentTimelineItem): void {
  const signature = [event.incidentId, event.timestamp, event.type, event.summary].join(":");
  if (!events.some((current) => [current.incidentId, current.timestamp, current.type, current.summary].join(":") === signature)) events.push(event);
}

function safeSummary(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, 220) : fallback;
}

export class SOCTimelineEngine {
  build(incident: TimelineSource): SOCIncidentTimelineItem[] {
    const incidentId = incident.incidentId ?? "unknown-incident";
    const baseTimestamp = incident.timestamp ?? Date.now();
    const events: SOCIncidentTimelineItem[] = [];

    pushUnique(events, {
      incidentId,
      timestamp: baseTimestamp,
      type: "ioc",
      summary: incident.ioc?.value ? `IOC detected: ${incident.ioc.value}` : "IOC detection registered",
      severity: incident.scoring?.riskLevel,
      source: "ioc",
    });

    if (typeof incident.scoring?.threatScore === "number") {
      pushUnique(events, {
        incidentId,
        timestamp: baseTimestamp + 1,
        type: "correlation",
        summary: `Threat score calculated at ${Math.round(incident.scoring.threatScore)}/100`,
        severity: incident.scoring.riskLevel,
        source: "scoring",
      });
    }

    for (const item of incident.correlation?.timeline ?? []) {
      pushUnique(events, {
        incidentId,
        timestamp: item.timestamp ?? baseTimestamp + 2,
        type: "correlation",
        summary: safeSummary(item.summary, "Correlation signal observed"),
        severity: typeof item.severity === "number" ? String(item.severity) : undefined,
        source: item.sources?.join(", ") || "correlation",
      });
    }

    for (const summary of incident.attackIntelligence?.timelineSummary ?? []) {
      pushUnique(events, {
        incidentId,
        timestamp: baseTimestamp + 3,
        type: "intelligence",
        summary: safeSummary(summary, "Attack intelligence updated"),
        severity: incident.attackIntelligence?.severityNarrative,
        source: "attack-intelligence",
      });
    }

    for (const step of incident.narrative?.attackFlow ?? []) {
      pushUnique(events, {
        incidentId,
        timestamp: baseTimestamp + 4,
        type: "intelligence",
        summary: safeSummary(step, "Narrative step recorded"),
        source: "narrative",
      });
    }

    for (const action of incident.actions ?? []) {
      pushUnique(events, {
        incidentId,
        timestamp: baseTimestamp + 5,
        type: "action",
        summary: action.actionType ? `Recommended action: ${action.actionType}` : "SOC action recommended",
        severity: action.priority,
        source: "soc-actions",
      });
    }

    for (const response of incident.responses ?? []) {
      pushUnique(events, {
        incidentId,
        timestamp: baseTimestamp + 6,
        type: "automation",
        summary: response.responseType ? `Prepared response: ${response.responseType}` : "SOC response prepared",
        severity: response.priority,
        source: response.requiresApproval ? "approval-required" : "response",
      });
    }

    if (incident.aiOperator?.contextSummary) {
      pushUnique(events, {
        incidentId,
        timestamp: baseTimestamp + 7,
        type: "ai",
        summary: safeSummary(incident.aiOperator.contextSummary, "AI operator insight generated"),
        severity: incident.aiOperator.adjustedPriority,
        source: "ai-operator",
      });
    }

    return events.sort((left, right) => left.timestamp - right.timestamp);
  }

  buildMany(incidents: TimelineSource[], limit = 250): SOCIncidentTimelineItem[] {
    return incidents.flatMap((incident) => this.build(incident)).sort((left, right) => right.timestamp - left.timestamp).slice(0, limit);
  }
}

export const socTimelineEngine = new SOCTimelineEngine();
