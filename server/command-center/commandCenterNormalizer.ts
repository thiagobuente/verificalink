export interface SOCCommandEvent {
  eventId: string;
  tenantId: string;
  type: "ioc_detected" | "incident_created" | "correlation_updated" | "action_executed" | "ai_insight_generated" | "automation_triggered";
  timestamp: number;
  severity: string;
  summary: string;
  payload: Record<string, unknown>;
}

const fallbackEvent: SOCCommandEvent = {
  eventId: "last-known-empty",
  tenantId: "unknown",
  type: "ioc_detected",
  timestamp: Date.now(),
  severity: "low",
  summary: "No recent SOC events available",
  payload: {},
};

let lastValidEvents: SOCCommandEvent[] = [fallbackEvent];
let lastValidFeed: Record<string, unknown> = { events: lastValidEvents, activeIncidents: [], aiInsights: [], automationStatus: {} };
let lastValidIncidents: unknown[] = [];

export function normalizeCommandEvent(input: SOCCommandEvent | undefined): SOCCommandEvent {
  if (!input?.eventId || !input.tenantId || !input.type) return lastValidEvents[0];
  const normalized = { eventId: input.eventId, tenantId: input.tenantId, type: input.type, timestamp: input.timestamp || Date.now(), severity: input.severity || "low", summary: input.summary || "SOC event", payload: input.payload ?? {} };
  lastValidEvents = [normalized, ...lastValidEvents].slice(0, 500);
  return normalized;
}

export function rememberCommandFeed(feed: Record<string, unknown>): Record<string, unknown> {
  if (!feed || Object.keys(feed).length === 0) return lastValidFeed;
  lastValidFeed = feed;
  if (Array.isArray(feed.activeIncidents)) lastValidIncidents = feed.activeIncidents;
  if (Array.isArray(feed.events) && feed.events.length > 0) lastValidEvents = feed.events as SOCCommandEvent[];
  return feed;
}

export function lastKnownCommandState() {
  return { lastValidFeed, lastValidIncidents, lastValidEvents };
}
