import type { Incident } from "../../providers/decision/incidentEngine";

const registry = new Map<string, Incident>();
const requestLocks = new Set<string>();

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

export function registerIncident(incident: Incident): Incident {
  const existing = registry.get(incident.id);
  if (!existing) {
    registry.set(incident.id, incident);
    return incident;
  }
  const merged: Incident = {
    ...existing,
    ...incident,
    relatedIOCs: unique([...existing.relatedIOCs, ...incident.relatedIOCs]),
    sources: unique([...existing.sources, ...incident.sources]),
    firstSeen: Math.min(existing.firstSeen, incident.firstSeen),
    lastSeen: Math.max(existing.lastSeen, incident.lastSeen),
    confidence: Math.max(existing.confidence, incident.confidence),
  };
  registry.set(incident.id, merged);
  return merged;
}

export function withIncidentCreationLock<T>(incidentId: string, callback: () => T): T | undefined {
  if (requestLocks.has(incidentId)) return undefined;
  requestLocks.add(incidentId);
  try {
    return callback();
  } finally {
    requestLocks.delete(incidentId);
  }
}

export function listRegisteredIncidents(): Incident[] {
  return [...registry.values()];
}
