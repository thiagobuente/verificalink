import type { IocType, NormalizedThreatResult } from "../interfaces/provider";

export type SecurityEventType = "ioc" | "exposure" | "reputation" | "malware" | "scan";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  source: string;
  value: string;
  timestamp: number;
  severity: number;
  tags: string[];
}

export interface SecurityTimelineEvent {
  timestamp: number;
  summary: string;
  severity: number;
  sources: string[];
}

export interface IocCorrelationResult {
  correlationScore: number;
  relatedCluster: string[];
  correlationExplanation: string[];
  timeline: SecurityTimelineEvent[];
}

export interface CorrelationInput {
  ioc: string;
  iocType: IocType;
  riskScore: number;
  malicious: boolean;
  tags: string[];
  categories: string[];
  references: string[];
  timeline: NormalizedThreatResult["timeline"];
  providers: NormalizedThreatResult[];
  threatScore?: number;
  riskLevel?: string;
  explanation?: string[];
}

type PatternSignal = {
  score: number;
  explanation: string[];
};

const exposureProviders = new Set(["shodan", "censys"]);
const malwareProviders = new Set(["virustotal", "alienvault-otx"]);

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function stableId(parts: string[]): string {
  let hash = 0;
  const input = parts.join("|");
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function eventTimestamp(result: NormalizedThreatResult, fallbackIndex: number): number {
  const timelineTimestamp = result.timeline.map((event) => Date.parse(event.timestamp)).find((value) => Number.isFinite(value));
  const queriedAt = Date.parse(result.queriedAt);
  if (timelineTimestamp !== undefined) return timelineTimestamp;
  if (Number.isFinite(queriedAt)) return queriedAt;
  return fallbackIndex;
}

function eventTypeForProvider(result: NormalizedThreatResult): SecurityEventType {
  if (result.providerId === "shodan" || result.providerId === "censys") return "exposure";
  if (result.providerId === "greynoise") return result.malicious ? "scan" : "reputation";
  if (result.providerId === "virustotal" || result.providerId === "alienvault-otx") return result.malicious ? "malware" : "reputation";
  if (result.providerId === "urlscan") return result.malicious ? "scan" : "ioc";
  return result.malicious ? "reputation" : "ioc";
}

export function toSecurityEvents(input: CorrelationInput): SecurityEvent[] {
  const seen = new Set<string>();
  const events: SecurityEvent[] = [];

  input.providers.forEach((result, index) => {
    const timestamp = eventTimestamp(result, index);
    const type = eventTypeForProvider(result);
    const tags = unique([...result.tags, ...result.categories, result.reputation, result.iocType]);
    const key = [result.providerId, type, result.ioc.toLowerCase(), String(timestamp)].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    events.push({
      id: stableId([result.providerId, type, result.ioc, String(timestamp)]),
      type,
      source: result.providerName,
      value: result.ioc,
      timestamp,
      severity: clampScore(result.riskScore),
      tags,
    });
  });

  return events.sort((a, b) => a.timestamp - b.timestamp || a.source.localeCompare(b.source));
}

function providerIds(results: NormalizedThreatResult[]): Set<string> {
  return new Set(results.map((result) => result.providerId));
}

function riskyResults(results: NormalizedThreatResult[]): NormalizedThreatResult[] {
  return results.filter((result) => result.malicious || result.riskScore >= 35 || result.reputation === "malicious" || result.reputation === "suspicious");
}

function hasBenignGreyNoise(results: NormalizedThreatResult[]): boolean {
  return results.some((result) => result.providerId === "greynoise" && (result.reputation === "trusted" || /benign|riot|business/i.test([...result.tags, ...result.categories].join(" "))));
}

function detectPatterns(input: CorrelationInput, events: SecurityEvent[]): PatternSignal {
  const ids = providerIds(input.providers);
  const risky = riskyResults(input.providers);
  const riskySources = new Set(risky.map((result) => result.providerId));
  const explanations: string[] = [];
  let score = 0;

  if (riskySources.size >= 2) {
    score += Math.min(42, 18 * riskySources.size);
    explanations.push("Multiple providers detected malicious or suspicious activity");
  }

  if ([...exposureProviders].every((provider) => ids.has(provider))) {
    score += 24;
    explanations.push("Exposure confirmed by Shodan and Censys");
  }

  if ([...malwareProviders].every((provider) => ids.has(provider)) && risky.some((result) => malwareProviders.has(result.providerId))) {
    score += 22;
    explanations.push("VirusTotal and AlienVault OTX indicate possible malware campaign context");
  }

  if (ids.has("abuseipdb") && hasBenignGreyNoise(input.providers)) {
    score -= 24;
    explanations.push("Reputation conflict detected across sources");
  }

  if (ids.has("greynoise") && ids.has("urlscan") && events.some((event) => event.type === "scan" && event.severity >= 35)) {
    score += 22;
    explanations.push("Temporal correlation indicates active scanning");
  }

  return { score, explanation: explanations };
}

function temporalBoost(events: SecurityEvent[]): number {
  if (events.length < 2) return 0;
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  let boost = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const withinOneDay = Math.abs(current.timestamp - previous.timestamp) <= 24 * 60 * 60 * 1000;
    if (withinOneDay && previous.type === current.type && previous.source !== current.source) boost += 6;
  }
  return Math.min(18, boost);
}

function extractSharedObservables(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = new URL(value);
    return unique([value, parsed.hostname, parsed.hostname.replace(/^www\./, "")]);
  } catch {
    return [value];
  }
}

function buildRelatedCluster(input: CorrelationInput, events: SecurityEvent[]): string[] {
  const observables = input.providers.flatMap((result) => [
    result.ioc,
    result.country,
    result.asn,
    ...result.tags,
    ...result.categories,
    ...result.references,
  ]);
  const eventValues = events.map((event) => event.value);
  return unique([input.ioc, ...eventValues, ...observables].flatMap(extractSharedObservables)).slice(0, 32);
}

function buildTimeline(events: SecurityEvent[]): SecurityTimelineEvent[] {
  const grouped = new Map<string, SecurityEvent[]>();
  for (const event of events) {
    const bucket = String(Math.floor(event.timestamp / (60 * 60 * 1000)));
    const key = bucket + "|" + event.type;
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  return [...grouped.values()].map((items) => {
    const sources = unique(items.map((item) => item.source));
    const severity = clampScore(items.reduce((max, item) => Math.max(max, item.severity), 0));
    const type = items[0]?.type ?? "ioc";
    return {
      timestamp: Math.min(...items.map((item) => item.timestamp)),
      summary: sources.join(" and ") + " reported " + type + " signal",
      severity,
      sources,
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
}

function calculateCorrelationScore(input: CorrelationInput, events: SecurityEvent[], pattern: PatternSignal): number {
  const risky = riskyResults(input.providers);
  const riskyProviderCount = new Set(risky.map((result) => result.providerId)).size;
  const consensusMultiplier = riskyProviderCount >= 2 ? Math.pow(riskyProviderCount, 1.35) : 0.55;
  const base = Math.min(36, risky.reduce((sum, result) => sum + result.riskScore, 0) / Math.max(1, risky.length) * 0.32);
  let score = base * consensusMultiplier + pattern.score + temporalBoost(events);

  if (hasBenignGreyNoise(input.providers)) score -= 22;
  if (riskyProviderCount <= 1) score = Math.min(score, 45);
  if (riskyProviderCount < 2 && score > 60) score = 60;
  if (riskyProviderCount < 2 && input.providers.length > 1) score = Math.min(score, 50);

  return clampScore(score);
}

export function correlateIocResult(input: CorrelationInput): IocCorrelationResult {
  const events = toSecurityEvents(input);
  const pattern = detectPatterns(input, events);
  const correlationScore = calculateCorrelationScore(input, events, pattern);
  const explanation = unique(pattern.explanation);

  if (events.length <= 1 && correlationScore < 35) {
    explanation.push("Single-source signal only; correlation confidence reduced");
  }

  return {
    correlationScore,
    relatedCluster: buildRelatedCluster(input, events),
    correlationExplanation: explanation,
    timeline: buildTimeline(events),
  };
}
