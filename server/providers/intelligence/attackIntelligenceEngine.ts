import type { IocCorrelationResult } from "../correlation/correlationEngine";
import type { Incident } from "../decision/incidentEngine";
import type { NormalizedThreatResult } from "../interfaces/provider";

export interface AttackIntelligence {
  incidentId: string;
  summary: string;
  attackType: string;
  confidence: number;
  actorProfile?: string;
  infrastructure: string[];
  observedBehavior: string[];
  timelineSummary: string[];
  severityNarrative: "low" | "medium" | "high" | "critical";
}

export interface Campaign {
  id: string;
  name: string;
  relatedIncidents: string[];
  sharedInfrastructure: string[];
  firstSeen: number;
  lastSeen: number;
}

export interface AttackIntelligenceInput {
  incident: Incident;
  correlation?: IocCorrelationResult;
  providers?: NormalizedThreatResult[];
  threatScore?: number;
  riskLevel?: string;
  explanation?: string[];
}

const intelligenceStore = new Map<string, AttackIntelligence>();
const campaignStore = new Map<string, Campaign>();
const maxSummaryLength = 220;

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

function truncateSummary(summary: string): string {
  return summary.length <= maxSummaryLength ? summary : summary.slice(0, maxSummaryLength - 1).trimEnd() + "…";
}

function providerIds(input: AttackIntelligenceInput): Set<string> {
  return new Set((input.providers ?? []).map((provider) => provider.providerId));
}

function providerNames(input: AttackIntelligenceInput): Set<string> {
  return new Set((input.providers ?? []).map((provider) => provider.providerName));
}

function hasProvider(input: AttackIntelligenceInput, id: string): boolean {
  return providerIds(input).has(id);
}

function hasMaliciousProvider(input: AttackIntelligenceInput, id: string): boolean {
  return (input.providers ?? []).some((provider) => provider.providerId === id && (provider.malicious || provider.riskScore >= 35));
}

function classifyAttackType(input: AttackIntelligenceInput): AttackIntelligence["attackType"] {
  const ids = providerIds(input);
  const tags = (input.providers ?? []).flatMap((provider) => [...provider.tags, ...provider.categories]).join(" ").toLowerCase();
  const cluster = input.correlation?.relatedCluster.join(" ").toLowerCase() ?? "";
  if (hasMaliciousProvider(input, "greynoise") && hasProvider(input, "urlscan")) return "scanning activity";
  if (hasMaliciousProvider(input, "virustotal") || (hasProvider(input, "alienvault-otx") && /malware|trojan|payload|ransom/.test(tags))) return "malware distribution";
  if (/phish|login|credential|bank/.test(tags + " " + cluster)) return "phishing infrastructure";
  if (/botnet|scanner|c2|command/.test(tags)) return "botnet activity";
  if (ids.has("shodan") || ids.has("censys")) return "exposed service exploitation";
  return "unknown suspicious activity";
}

function actorProfileFor(attackType: string): string | undefined {
  if (attackType === "scanning activity") return "opportunistic scanner";
  if (attackType === "malware distribution") return "malware operator";
  if (attackType === "phishing infrastructure") return "phishing operator";
  if (attackType === "botnet activity") return "botnet node";
  if (attackType === "unknown suspicious activity") return "unknown attacker";
  return undefined;
}

function severityNarrative(input: AttackIntelligenceInput): AttackIntelligence["severityNarrative"] {
  return input.incident.severity;
}

function severityPhrase(severity: AttackIntelligence["severityNarrative"]): string {
  if (severity === "low") return "low risk activity detected";
  if (severity === "medium") return "suspicious activity observed";
  if (severity === "high") return "active threat indicators present";
  return "confirmed malicious infrastructure activity";
}

function extractInfrastructure(input: AttackIntelligenceInput): string[] {
  const providerInfra = (input.providers ?? []).flatMap((provider) => [
    provider.ioc,
    provider.country,
    provider.asn,
    ...provider.references,
  ]);
  return unique([
    ...input.incident.relatedIOCs,
    ...(input.correlation?.relatedCluster ?? []),
    ...providerInfra,
  ]).slice(0, 40);
}

function observedBehavior(input: AttackIntelligenceInput, attackType: string): string[] {
  const behavior = [
    input.correlation && input.correlation.correlationScore >= 70 ? "Multiple intelligence sources agree on related activity" : undefined,
    hasProvider(input, "shodan") || hasProvider(input, "censys") ? "Internet-exposed infrastructure was observed" : undefined,
    hasMaliciousProvider(input, "virustotal") ? "Malware reputation was reported by file or URL intelligence" : undefined,
    hasMaliciousProvider(input, "abuseipdb") ? "Abuse reputation was reported for the infrastructure" : undefined,
    hasMaliciousProvider(input, "greynoise") ? "Scanning behavior was observed in internet telemetry" : undefined,
    attackType === "phishing infrastructure" ? "Infrastructure resembles phishing or credential targeting" : undefined,
  ];
  return unique(behavior).slice(0, 8);
}

function timelineSummary(input: AttackIntelligenceInput): string[] {
  const providerEvents = (input.providers ?? []).flatMap((provider) => provider.timeline.map((event) => ({
    timestamp: Date.parse(event.timestamp),
    summary: event.description ? provider.providerName + ": " + event.description : provider.providerName + ": " + event.title,
  })));
  const correlationEvents = input.correlation?.timeline.map((event) => ({
    timestamp: event.timestamp,
    summary: event.sources.join(" and ") + " confirmed " + event.summary.toLowerCase(),
  })) ?? [];
  return unique([...providerEvents, ...correlationEvents]
    .filter((event) => Number.isFinite(event.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((event) => event.summary))
    .slice(0, 6);
}

function buildSummary(input: AttackIntelligenceInput, attackType: string, behavior: string[]): string {
  const sources = [...providerNames(input)].slice(0, 3).join(", ");
  const correlation = input.correlation?.correlationScore ?? 0;
  if (attackType === "scanning activity") return truncateSummary("Multiple sources indicate active scanning activity against related infrastructure" + (sources ? " from " + sources : "") + ".");
  if (attackType === "malware distribution") return truncateSummary("Malicious infrastructure is supported by malware and reputation intelligence across related indicators.");
  if (attackType === "phishing infrastructure") return truncateSummary("Related indicators suggest phishing infrastructure with suspicious reputation and shared observables.");
  if (attackType === "exposed service exploitation") return truncateSummary("Exposure intelligence indicates reachable services that may be targeted or abused.");
  if (attackType === "botnet activity") return truncateSummary("Coordinated activity suggests botnet-style infrastructure or automated abuse.");
  const detail = behavior[0] ? " " + behavior[0] + "." : "";
  return truncateSummary("Suspicious activity was correlated across available intelligence sources with correlation score " + String(correlation) + "." + detail);
}

function campaignKey(intelligence: AttackIntelligence): string {
  const infrastructure = intelligence.infrastructure.map((item) => item.toLowerCase()).sort().slice(0, 8).join(",");
  return stableHash([intelligence.attackType, infrastructure]);
}

function upsertCampaign(intelligence: AttackIntelligence, incident: Incident): void {
  if (intelligence.infrastructure.length < 2) return;
  const id = campaignKey(intelligence);
  const existing = campaignStore.get(id);
  const next: Campaign = existing ? {
    ...existing,
    relatedIncidents: unique([...existing.relatedIncidents, incident.id]).sort(),
    sharedInfrastructure: unique([...existing.sharedInfrastructure, ...intelligence.infrastructure]).sort().slice(0, 40),
    firstSeen: Math.min(existing.firstSeen, incident.firstSeen),
    lastSeen: Math.max(existing.lastSeen, incident.lastSeen),
  } : {
    id,
    name: intelligence.attackType.replace(/(^|\s)([a-z])/g, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase()) + " Campaign",
    relatedIncidents: [incident.id],
    sharedInfrastructure: intelligence.infrastructure,
    firstSeen: incident.firstSeen,
    lastSeen: incident.lastSeen,
  };
  campaignStore.set(id, next);
}

export class AttackIntelligenceEngine {
  createIntelligence(input: AttackIntelligenceInput): AttackIntelligence {
    const attackType = classifyAttackType(input);
    const infrastructure = extractInfrastructure(input);
    const behavior = observedBehavior(input, attackType);
    const severity = severityNarrative(input);
    const intelligence: AttackIntelligence = {
      incidentId: input.incident.id,
      summary: buildSummary(input, attackType, behavior),
      attackType,
      confidence: input.incident.confidence,
      actorProfile: actorProfileFor(attackType),
      infrastructure,
      observedBehavior: unique([severityPhrase(severity), ...behavior]).slice(0, 8),
      timelineSummary: timelineSummary(input),
      severityNarrative: severity,
    };
    intelligenceStore.set(input.incident.id, intelligence);
    upsertCampaign(intelligence, input.incident);
    return intelligence;
  }

  listIntelligence(): AttackIntelligence[] {
    return [...intelligenceStore.values()].sort((a, b) => b.confidence - a.confidence);
  }

  listCampaigns(): Campaign[] {
    return [...campaignStore.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  }
}

export const attackIntelligenceEngine = new AttackIntelligenceEngine();
