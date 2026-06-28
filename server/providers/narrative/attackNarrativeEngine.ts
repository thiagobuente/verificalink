import { toSecurityEvents, type IocCorrelationResult, type SecurityEvent } from "../correlation/correlationEngine";
import type { Incident } from "../decision/incidentEngine";
import type { NormalizedThreatResult } from "../interfaces/provider";

export type NarrativeAttackType =
  | "scanning campaign"
  | "malware distribution infrastructure"
  | "phishing attempt"
  | "botnet activity"
  | "exploitation attempt"
  | "unknown suspicious behavior";

export interface AttackNarrative {
  incidentId: string;
  title: string;
  summary: string;
  detailedExplanation: string[];
  attackFlow: string[];
  evidence: string[];
  conclusion: string;
  confidence: number;
  attackType: NarrativeAttackType;
  explanationConfidence: number;
}

export interface AttackNarrativeInput {
  incident: Incident;
  correlation?: IocCorrelationResult;
  providers?: NormalizedThreatResult[];
  threatScore?: number;
  riskLevel?: string;
  explanation?: string[];
}

const narrativeStore = new Map<string, { fingerprint: string; narrative: AttackNarrative }>();
const maxSummaryLength = 220;

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
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

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function truncate(value: string, max = maxSummaryLength): string {
  return value.length <= max ? value : value.slice(0, max - 3).trimEnd() + "...";
}

function providerIds(input: AttackNarrativeInput): Set<string> {
  return new Set((input.providers ?? []).map((provider) => provider.providerId));
}

function providerNames(input: AttackNarrativeInput): string[] {
  return unique((input.providers ?? []).map((provider) => provider.providerName));
}

function hasProvider(input: AttackNarrativeInput, id: string): boolean {
  return providerIds(input).has(id);
}

function hasRisk(input: AttackNarrativeInput, id: string): boolean {
  return (input.providers ?? []).some((provider) => provider.providerId === id && (provider.malicious || provider.riskScore >= 35 || provider.reputation === "malicious" || provider.reputation === "suspicious"));
}

function providerTags(input: AttackNarrativeInput): string {
  return (input.providers ?? []).flatMap((provider) => [...provider.tags, ...provider.categories]).join(" ").toLowerCase();
}

function classifyAttackType(input: AttackNarrativeInput): NarrativeAttackType {
  const tags = providerTags(input);
  const cluster = input.correlation?.relatedCluster.join(" ").toLowerCase() ?? "";
  if (hasRisk(input, "greynoise") && hasProvider(input, "urlscan")) return "scanning campaign";
  if (hasRisk(input, "virustotal") || (hasProvider(input, "alienvault-otx") && /malware|payload|trojan|ransom/.test(tags))) return "malware distribution infrastructure";
  if (/phish|credential|login|bank/.test(tags + " " + cluster)) return "phishing attempt";
  if (/botnet|c2|command|scanner/.test(tags)) return "botnet activity";
  if (hasProvider(input, "shodan") || hasProvider(input, "censys")) return "exploitation attempt";
  return "unknown suspicious behavior";
}

function titleFor(attackType: NarrativeAttackType, incident: Incident): string {
  if (attackType === "scanning campaign") return "Malicious Scanning Activity Detected";
  if (attackType === "malware distribution infrastructure") return "Potential Malware Distribution Node";
  if (attackType === "phishing attempt") return "Suspicious Phishing Infrastructure Detected";
  if (attackType === "botnet activity") return "Botnet Activity Pattern Detected";
  if (attackType === "exploitation attempt") return "Suspicious Infrastructure Exposure";
  return incident.severity === "critical" || incident.severity === "high" ? "Coordinated Attack Pattern Identified" : "Suspicious Activity Requires Review";
}

function securityEvents(input: AttackNarrativeInput): SecurityEvent[] {
  if (!input.providers || input.providers.length === 0) return [];
  return toSecurityEvents({
    ioc: input.incident.relatedIOCs[0] ?? input.incident.id,
    iocType: "unknown",
    riskScore: input.threatScore ?? input.incident.confidence,
    malicious: input.incident.severity === "high" || input.incident.severity === "critical",
    tags: [],
    categories: [],
    references: [],
    timeline: [],
    providers: input.providers,
    threatScore: input.threatScore,
    riskLevel: input.riskLevel,
    explanation: input.explanation,
  });
}

function buildSummary(input: AttackNarrativeInput, attackType: NarrativeAttackType): string {
  const sources = providerNames(input).slice(0, 3).join(", ");
  const prefix = sources ? " based on " + sources : "";
  if (attackType === "scanning campaign") return truncate("Multiple sources indicate coordinated scanning activity targeting related infrastructure" + prefix + ".");
  if (attackType === "malware distribution infrastructure") return truncate("Evidence suggests infrastructure associated with malware distribution or malicious payload activity" + prefix + ".");
  if (attackType === "phishing attempt") return truncate("Related indicators show signs of phishing infrastructure or credential-targeting behavior" + prefix + ".");
  if (attackType === "botnet activity") return truncate("Infrastructure shows signs of distributed or automated attack behavior" + prefix + ".");
  if (attackType === "exploitation attempt") return truncate("Evidence suggests exposed services may be targeted or abused" + prefix + ".");
  return truncate("Suspicious behavior was observed across the available incident evidence" + prefix + ".");
}

function evidenceFromProvider(provider: NormalizedThreatResult): string[] {
  const evidence: string[] = [];
  if (provider.providerId === "virustotal") {
    const raw = provider.raw && typeof provider.raw === "object" ? provider.raw as { data?: { attributes?: { last_analysis_stats?: { malicious?: number; suspicious?: number; harmless?: number; undetected?: number } } } } : {};
    const stats = raw.data?.attributes?.last_analysis_stats;
    const detections = (stats?.malicious ?? 0) + (stats?.suspicious ?? 0);
    const total = detections + (stats?.harmless ?? 0) + (stats?.undetected ?? 0);
    if (detections > 0) evidence.push("VirusTotal: " + String(detections) + "/" + String(total) + " engines detected suspicious or malicious activity");
  }
  if (provider.providerId === "abuseipdb") {
    const raw = provider.raw && typeof provider.raw === "object" ? provider.raw as { data?: { abuseConfidenceScore?: number } } : {};
    const score = raw.data?.abuseConfidenceScore;
    if (typeof score === "number") evidence.push("AbuseIPDB: confidence score " + String(Math.round(score)) + "%");
  }
  if (provider.providerId === "shodan") {
    const raw = provider.raw && typeof provider.raw === "object" ? provider.raw as { ports?: number[] } : {};
    if (raw.ports?.length) evidence.push("Shodan: exposed ports detected (" + raw.ports.slice(0, 5).join(", ") + ")");
  }
  if (provider.providerId === "censys") {
    if (provider.categories.length > 0 || provider.tags.length > 0) evidence.push("Censys: exposed service or certificate context observed");
  }
  if (provider.providerId === "greynoise" && provider.malicious) evidence.push("GreyNoise: activity classified as malicious scanner");
  if (provider.providerId === "urlscan" && (provider.malicious || provider.riskScore >= 35)) evidence.push("URLScan: suspicious page or network activity observed");
  if (provider.providerId === "alienvault-otx" && provider.categories.length > 0) evidence.push("AlienVault OTX: related pulse context found");
  return evidence;
}

function buildEvidence(input: AttackNarrativeInput): string[] {
  return unique((input.providers ?? []).flatMap(evidenceFromProvider)).slice(0, 10);
}

function buildAttackFlow(input: AttackNarrativeInput, events: SecurityEvent[]): string[] {
  const eventFlow = events
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((event) => {
      if (event.source === "VirusTotal") return "Initial signal detected by VirusTotal";
      if (event.source === "AbuseIPDB") return "AbuseIPDB confirmed abuse reputation";
      if (event.source === "Shodan") return "Shodan identified exposed service";
      if (event.source === "Censys") return "Censys confirmed exposed infrastructure context";
      if (event.source === "GreyNoise") return "GreyNoise classified activity from internet telemetry";
      if (event.source === "URLScan") return "URLScan observed suspicious web activity";
      return event.source + " contributed an intelligence signal";
    });
  const correlationFlow = input.correlation ? ["Correlation engine grouped related events as one incident"] : [];
  return unique([...eventFlow, ...correlationFlow]).slice(0, 8);
}

function detailedExplanation(input: AttackNarrativeInput, attackType: NarrativeAttackType): string[] {
  const details = [
    "The incident groups " + String(input.incident.relatedIOCs.length) + " related indicator" + (input.incident.relatedIOCs.length === 1 ? "" : "s") + ".",
    input.correlation ? "The correlation score is " + String(input.correlation.correlationScore) + ", based on overlap between provider signals." : undefined,
    input.threatScore !== undefined ? "The threat score is " + String(input.threatScore) + ", based on individual provider risk signals." : undefined,
    "The narrative classification is " + attackType + ".",
  ];
  return unique(details).slice(0, 6);
}

function buildConclusion(input: AttackNarrativeInput): string {
  const correlationScore = input.correlation?.correlationScore ?? 0;
  if (input.incident.severity === "critical" && correlationScore >= 80) return "Strong evidence indicates coordinated attack activity across multiple sources.";
  if (input.incident.severity === "high" || correlationScore >= 60) return "This incident is consistent with active malicious infrastructure behavior.";
  if (correlationScore >= 35) return "No clear malicious pattern is confirmed, but multiple suspicious signals exist.";
  return "Current evidence is limited; continue monitoring for additional confirmation.";
}

function explanationConfidence(input: AttackNarrativeInput): number {
  const providerCount = new Set((input.providers ?? []).map((provider) => provider.providerId)).size;
  const base = (input.correlation?.correlationScore ?? 0) * 0.45 + (input.threatScore ?? 0) * 0.25 + input.incident.confidence * 0.3;
  const consistencyBoost = providerCount >= 2 ? Math.min(12, providerCount * 3) : -12;
  const conflictPenalty = input.correlation?.correlationExplanation.some((item) => /conflict/i.test(item)) ? 18 : 0;
  return clampScore(base + consistencyBoost - conflictPenalty);
}

function fingerprint(input: AttackNarrativeInput): string {
  return stableHash([
    input.incident.id,
    String(input.incident.lastSeen),
    String(input.incident.confidence),
    String(input.correlation?.correlationScore ?? 0),
    String(input.threatScore ?? 0),
    ...input.incident.relatedIOCs,
    ...(input.providers ?? []).map((provider) => provider.providerId + ":" + String(provider.riskScore)),
  ]);
}

export class AttackNarrativeEngine {
  createNarrative(input: AttackNarrativeInput): AttackNarrative {
    const currentFingerprint = fingerprint(input);
    const cached = narrativeStore.get(input.incident.id);
    if (cached?.fingerprint === currentFingerprint) return cached.narrative;

    const attackType = classifyAttackType(input);
    const events = securityEvents(input);
    const narrative: AttackNarrative = {
      incidentId: input.incident.id,
      title: titleFor(attackType, input.incident),
      summary: buildSummary(input, attackType),
      detailedExplanation: detailedExplanation(input, attackType),
      attackFlow: buildAttackFlow(input, events),
      evidence: buildEvidence(input),
      conclusion: buildConclusion(input),
      confidence: input.incident.confidence,
      attackType,
      explanationConfidence: explanationConfidence(input),
    };
    narrativeStore.set(input.incident.id, { fingerprint: currentFingerprint, narrative });
    return narrative;
  }

  listNarratives(): AttackNarrative[] {
    return [...narrativeStore.values()].map((entry) => entry.narrative).sort((a, b) => b.explanationConfidence - a.explanationConfidence);
  }
}

export const attackNarrativeEngine = new AttackNarrativeEngine();
