export type Severity = "low" | "medium" | "high" | "critical" | string;

export interface SOCUIIncident {
  id: string;
  title: string;
  severity: Severity;
  status: string;
  confidence: number;
  timestamp: number;
  ioc?: string;
  sources: string[];
  correlationScore?: number;
  threatScore?: number;
}

export interface SOCUIGraphNode {
  id: string;
  label: string;
  type: "ioc" | "provider" | "campaign" | "action";
  severity?: Severity;
}

export interface SOCUIGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SOCUITimelineItem {
  id: string;
  timestamp: number;
  summary: string;
  type: string;
  severity?: Severity;
  source?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function normalizeIncident(value: unknown): SOCUIIncident {
  const item = asRecord(value);
  const incident = asRecord(item.incident);
  const ioc = asRecord(item.ioc);
  const scoring = asRecord(item.scoring);
  const correlation = asRecord(item.correlation);
  const attackIntelligence = asRecord(item.attackIntelligence);
  const id = asString(item.incidentId, asString(incident.id, "incident-unknown"));
  const severity = asString(incident.severity, asString(scoring.riskLevel, "medium"));
  return {
    id,
    title: asString(incident.title, asString(attackIntelligence.summary, id)).slice(0, 96),
    severity,
    status: asString(incident.status, "detected"),
    confidence: asNumber(incident.confidence, asNumber(item.confidence, 0)),
    timestamp: asNumber(item.timestamp, Date.now()),
    ioc: asString(ioc.value, asString(ioc.ioc, "")),
    sources: asArray(incident.sources).map((source) => String(source)),
    correlationScore: asOptionalNumber(correlation.correlationScore),
    threatScore: asNumber(scoring.threatScore, asNumber(ioc.riskScore, 0)),
  };
}

export function normalizeIncidents(values: unknown): SOCUIIncident[] {
  return asArray(values).map(normalizeIncident);
}

export function correlationToGraph(incident: unknown): { nodes: SOCUIGraphNode[]; edges: SOCUIGraphEdge[] } {
  const item = asRecord(incident);
  const normalized = normalizeIncident(item);
  const providers = asArray(asRecord(item.ioc).providers);
  const cluster = asArray(asRecord(item.correlation).relatedCluster).map((value) => String(value));
  const nodes = new Map<string, SOCUIGraphNode>();
  const edges: SOCUIGraphEdge[] = [];
  nodes.set(normalized.id, { id: normalized.id, label: normalized.ioc || normalized.id, type: "ioc", severity: normalized.severity });
  for (const provider of providers) {
    const record = asRecord(provider);
    const providerId = asString(record.providerId, asString(record.providerName, "provider"));
    nodes.set(providerId, { id: providerId, label: asString(record.providerName, providerId), type: "provider" });
    edges.push({ id: normalized.id + ":" + providerId, source: normalized.id, target: providerId, label: asString(record.reputation, "observed") });
  }
  for (const related of cluster) {
    const id = "cluster:" + related;
    nodes.set(id, { id, label: related, type: "ioc", severity: normalized.severity });
    edges.push({ id: normalized.id + ":" + id, source: normalized.id, target: id, label: "related" });
  }
  return { nodes: [...nodes.values()], edges };
}

export function normalizeTimeline(values: unknown): SOCUITimelineItem[] {
  return asArray(values).map((value, index) => {
    const item = asRecord(value);
    return {
      id: asString(item.id, "timeline-" + String(index)),
      timestamp: asNumber(item.timestamp, Date.now()),
      summary: asString(item.summary, "SOC event observed"),
      type: asString(item.type, "event"),
      severity: asString(item.severity, "medium"),
      source: asString(item.source, "SOC"),
    };
  }).sort((left, right) => right.timestamp - left.timestamp);
}
