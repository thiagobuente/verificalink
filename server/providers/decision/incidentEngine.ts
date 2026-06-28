import type { NormalizedThreatResult } from "../interfaces/provider";
import type { IocCorrelationResult } from "../correlation/correlationEngine";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "investigating" | "closed";

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  confidence: number;
  relatedIOCs: string[];
  sources: string[];
  firstSeen: number;
  lastSeen: number;
  status: IncidentStatus;
}

export interface IncidentInput {
  ioc: string;
  riskScore: number;
  malicious: boolean;
  providers: NormalizedThreatResult[];
  correlation?: IocCorrelationResult;
  threatScore?: number;
  riskLevel?: string;
}

const incidentStore = new Map<string, Incident>();
const closedAfterMs = 48 * 60 * 60 * 1000;
const relatedEventWindowMs = 24 * 60 * 60 * 1000;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function severityFromScore(score: number): IncidentSeverity {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
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

function providerIds(input: IncidentInput): Set<string> {
  return new Set(input.providers.map((provider) => provider.providerId));
}

function riskyProviders(input: IncidentInput): Set<string> {
  return new Set(input.providers.filter((provider) => provider.malicious || provider.riskScore >= 35 || provider.reputation === "malicious" || provider.reputation === "suspicious").map((provider) => provider.providerId));
}

function hasGreyNoiseBenign(input: IncidentInput): boolean {
  return input.providers.some((provider) => provider.providerId === "greynoise" && (provider.reputation === "trusted" || /benign|riot|business/i.test([...provider.tags, ...provider.categories].join(" "))));
}

function hasGreyNoiseScan(input: IncidentInput): boolean {
  return input.providers.some((provider) => provider.providerId === "greynoise" && (provider.malicious || provider.reputation === "malicious"));
}

function hasUrlScanActivity(input: IncidentInput): boolean {
  return input.providers.some((provider) => provider.providerId === "urlscan" && (provider.malicious || provider.riskScore >= 35));
}

function hasVirusTotalMalware(input: IncidentInput): boolean {
  return input.providers.some((provider) => provider.providerId === "virustotal" && (provider.malicious || provider.riskScore >= 35));
}

function hasExposure(input: IncidentInput): boolean {
  const ids = providerIds(input);
  return ids.has("shodan") || ids.has("censys");
}

function hasConfirmedExposure(input: IncidentInput): boolean {
  const ids = providerIds(input);
  return ids.has("shodan") && ids.has("censys");
}

function eventTimes(input: IncidentInput): number[] {
  const correlationTimes = input.correlation?.timeline.map((event) => event.timestamp) ?? [];
  const providerTimes = input.providers.flatMap((provider) => [Date.parse(provider.queriedAt), ...provider.timeline.map((event) => Date.parse(event.timestamp))]);
  return [...correlationTimes, ...providerTimes].filter((value) => Number.isFinite(value));
}

function isShortPeriodActivity(input: IncidentInput): boolean {
  const times = eventTimes(input);
  if (times.length < 2) return false;
  return Math.max(...times) - Math.min(...times) <= relatedEventWindowMs;
}

function threatType(input: IncidentInput): string {
  if (hasGreyNoiseScan(input) && hasUrlScanActivity(input)) return "active-scan";
  if (hasVirusTotalMalware(input)) return "malware";
  if (hasConfirmedExposure(input)) return "exposure";
  return input.malicious ? "reputation" : "ioc";
}

function incidentTitle(input: IncidentInput): string {
  const type = threatType(input);
  if (type === "active-scan") return "Active scanning activity correlated";
  if (type === "malware") return "Possible malware campaign correlated";
  if (type === "exposure") return "Confirmed exposed asset correlation";
  if (type === "reputation") return "Reputation incident correlated";
  return "IOC correlation incident";
}

function relatedIocs(input: IncidentInput): string[] {
  return unique([
    input.ioc,
    ...(input.correlation?.relatedCluster ?? []),
    ...input.providers.map((provider) => provider.ioc),
  ]).sort();
}

function mainSource(input: IncidentInput): string {
  const risky = input.providers.find((provider) => provider.malicious || provider.riskScore >= 50);
  return risky?.providerId ?? input.providers[0]?.providerId ?? "unknown";
}

function incidentKey(input: IncidentInput): string {
  const cluster = relatedIocs(input).map((value) => value.toLowerCase()).sort().join(",");
  return stableHash([cluster, threatType(input), mainSource(input)]);
}

function calculateSeverityScore(input: IncidentInput): number {
  const riskyCount = riskyProviders(input).size;
  let score = input.correlation?.correlationScore ?? input.threatScore ?? input.riskScore;
  if (riskyCount >= 2) score += 20;
  if (hasExposure(input)) score += 10;
  if (hasVirusTotalMalware(input)) score += 15;
  if (hasGreyNoiseBenign(input)) score -= 20;
  if (hasGreyNoiseScan(input) && hasUrlScanActivity(input)) score += 15;
  if (isShortPeriodActivity(input) && riskyCount >= 2) score += 8;
  return clampScore(score);
}

function incidentStatus(existing: Incident | undefined, lastSeen: number, now: number): IncidentStatus {
  if (now - lastSeen > closedAfterMs) return "closed";
  if (existing) return "investigating";
  return "open";
}

function mergeIncident(existing: Incident, next: Incident): Incident {
  return {
    ...existing,
    title: next.title,
    severity: severityRank(next.severity) > severityRank(existing.severity) ? next.severity : existing.severity,
    confidence: clampScore(Math.max(existing.confidence, next.confidence) + 5),
    relatedIOCs: unique([...existing.relatedIOCs, ...next.relatedIOCs]).sort(),
    sources: unique([...existing.sources, ...next.sources]).sort(),
    firstSeen: Math.min(existing.firstSeen, next.firstSeen),
    lastSeen: Math.max(existing.lastSeen, next.lastSeen),
    status: incidentStatus(existing, Math.max(existing.lastSeen, next.lastSeen), Date.now()),
  };
}

function severityRank(severity: IncidentSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}

export class IncidentEngine {
  createIncident(input: IncidentInput): Incident | undefined {
    if (!input.correlation || input.correlation.correlationScore < 70) return undefined;

    const times = eventTimes(input);
    const now = Date.now();
    const firstSeen = times.length > 0 ? Math.min(...times) : now;
    const lastSeen = times.length > 0 ? Math.max(...times) : now;
    const severityScore = calculateSeverityScore(input);
    const id = incidentKey(input);
    const next: Incident = {
      id,
      title: incidentTitle(input),
      severity: severityFromScore(severityScore),
      confidence: clampScore(Math.max(input.correlation.correlationScore, input.threatScore ?? 0)),
      relatedIOCs: relatedIocs(input),
      sources: unique(input.providers.map((provider) => provider.providerName)).sort(),
      firstSeen,
      lastSeen,
      status: incidentStatus(undefined, lastSeen, now),
    };

    const existing = incidentStore.get(id);
    const merged = existing ? mergeIncident(existing, next) : next;
    incidentStore.set(id, merged);
    return merged;
  }

  getIncidents(): Incident[] {
    const now = Date.now();
    return [...incidentStore.values()].map((incident) => ({
      ...incident,
      status: now - incident.lastSeen > closedAfterMs ? "closed" : incident.status,
    }));
  }
}

export const incidentEngine = new IncidentEngine();
