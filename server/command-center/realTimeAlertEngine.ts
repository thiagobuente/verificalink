import type { SOCCommandEvent } from "./commandCenterNormalizer";

const seen = new Map<string, number>();
const cooldownMs = 5 * 60 * 1000;

export function buildRealTimeAlerts(events: SOCCommandEvent[]) {
  const now = Date.now();
  return events.filter((event) => {
    const key = event.tenantId + ":" + event.type + ":" + event.summary;
    if ((seen.get(key) ?? 0) + cooldownMs > now) return false;
    seen.set(key, now);
    return true;
  }).map((event) => ({ alertId: event.eventId, priority: event.severity, summary: event.summary, timestamp: event.timestamp }));
}
