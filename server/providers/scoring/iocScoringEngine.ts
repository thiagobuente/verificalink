import type { NormalizedThreatResult } from "../interfaces/provider";

export type IocRiskLevel = "low" | "medium" | "high" | "critical";

export interface IocScoringResult {
  threatScore: number;
  riskLevel: IocRiskLevel;
  explanation: string[];
}

type ScoreImpact = {
  score: number;
  explanation: string[];
  highSignal?: boolean;
  benignSignal?: boolean;
};

const sensitivePorts = new Set(["21", "22", "23", "25", "3389", "445", "1433", "3306", "5432", "6379", "9200"]);

function clampThreatScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function riskLevelFromScore(score: number): IocRiskLevel {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

function unique(messages: string[]): string[] {
  return [...new Set(messages.filter(Boolean))];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getNestedRecord(value: unknown, keys: string[]): Record<string, unknown> {
  return keys.reduce<Record<string, unknown>>((current, key) => asRecord(current[key]), asRecord(value));
}

function scoreVirusTotal(result: NormalizedThreatResult): ScoreImpact {
  const stats = getNestedRecord(result.raw, ["data", "attributes", "last_analysis_stats"]);
  const malicious = asNumber(stats.malicious) ?? 0;
  const suspicious = asNumber(stats.suspicious) ?? 0;
  const detections = malicious + suspicious;
  if (detections <= 0) return { score: Math.min(12, result.riskScore * 0.2), explanation: [] };

  return {
    score: Math.min(42, 18 + detections * 6),
    explanation: ["VirusTotal detected " + String(detections) + " engines as malicious or suspicious"],
    highSignal: true,
  };
}

function scoreAbuseIPDB(result: NormalizedThreatResult): ScoreImpact {
  const abuseConfidence = asNumber(getNestedRecord(result.raw, ["data"]).abuseConfidenceScore) ?? result.riskScore;
  if (abuseConfidence <= 0) return { score: 0, explanation: [] };

  return {
    score: Math.min(35, abuseConfidence * 0.35),
    explanation: abuseConfidence >= 50 ? ["AbuseIPDB reports high abuse confidence (" + String(Math.round(abuseConfidence)) + "%)"] : [],
    highSignal: abuseConfidence >= 50,
  };
}

function scoreAlienVault(result: NormalizedThreatResult): ScoreImpact {
  const pulseInfo = getNestedRecord(result.raw, ["pulse_info"]);
  const pulseCount = asNumber(pulseInfo.count) ?? result.categories.length;
  if (pulseCount <= 0) return { score: 0, explanation: [] };

  return {
    score: Math.min(26, 8 + pulseCount * 4),
    explanation: ["AlienVault OTX found " + String(pulseCount) + " related pulse" + (pulseCount === 1 ? "" : "s")],
    highSignal: pulseCount >= 4,
  };
}

function scoreURLScan(result: NormalizedThreatResult): ScoreImpact {
  const suspiciousSignals = result.malicious || result.categories.length > 0 || result.tags.some((tag) => /malware|phishing|suspicious/i.test(tag));
  if (!suspiciousSignals && result.riskScore <= 10) return { score: 0, explanation: [] };

  return {
    score: Math.min(30, result.riskScore * 0.45 + (suspiciousSignals ? 10 : 0)),
    explanation: suspiciousSignals ? ["URLScan reported suspicious activity or verdicts"] : [],
    highSignal: result.malicious || result.riskScore >= 50,
  };
}

function scoreShodan(result: NormalizedThreatResult): ScoreImpact {
  const ports = asRecord(result.raw).ports;
  const rawPorts = Array.isArray(ports) ? ports.map(String) : [];
  const exposedSensitivePorts = rawPorts.filter((port) => sensitivePorts.has(port));
  const vulnCount = Object.keys(asRecord(asRecord(result.raw).vulns)).length;
  const score = exposedSensitivePorts.length * 9 + vulnCount * 12;
  const explanation = [
    exposedSensitivePorts.length > 0 ? "Shodan exposed sensitive ports detected" : "",
    vulnCount > 0 ? "Shodan found " + String(vulnCount) + " known vulnerabilit" + (vulnCount === 1 ? "y" : "ies") : "",
  ];

  return {
    score: Math.min(36, score),
    explanation,
    highSignal: exposedSensitivePorts.length >= 2 || vulnCount > 0,
  };
}

function scoreCensys(result: NormalizedThreatResult): ScoreImpact {
  const services = getNestedRecord(result.raw, ["result"]).services;
  const serviceCount = Array.isArray(services) ? services.length : result.categories.length;
  const hasCertificates = result.categories.some((category) => /tls|ssl|certificate|https/i.test(category));
  const labels = result.tags.join(" ");
  const exposureScore = serviceCount * 5 + (hasCertificates ? 8 : 0) + (/malware|risky|exposed/i.test(labels) ? 15 : 0);
  if (exposureScore <= 0) return { score: 0, explanation: [] };

  return {
    score: Math.min(32, exposureScore),
    explanation: ["Censys observed exposed services and certificate context"],
    highSignal: serviceCount >= 4 || /malware|risky/i.test(labels),
  };
}

function scoreGreyNoise(result: NormalizedThreatResult): ScoreImpact {
  const raw = asRecord(result.raw);
  const classification = String(raw.classification ?? result.reputation).toLowerCase();
  const riot = raw.riot === true;
  if (riot || classification === "benign" || result.reputation === "trusted") {
    return {
      score: -28,
      explanation: ["GreyNoise classified the IP as benign or common business service"],
      benignSignal: true,
    };
  }
  if (classification === "malicious" || result.malicious) {
    return {
      score: 40,
      explanation: ["GreyNoise classified as malicious scanner"],
      highSignal: true,
    };
  }
  if (classification === "suspicious") {
    return {
      score: 20,
      explanation: ["GreyNoise classified the IP as suspicious"],
    };
  }
  return { score: 0, explanation: [] };
}

const providerScorers: Record<string, (result: NormalizedThreatResult) => ScoreImpact> = {
  virustotal: scoreVirusTotal,
  abuseipdb: scoreAbuseIPDB,
  "alienvault-otx": scoreAlienVault,
  urlscan: scoreURLScan,
  shodan: scoreShodan,
  censys: scoreCensys,
  greynoise: scoreGreyNoise,
};

function defaultProviderScore(result: NormalizedThreatResult): ScoreImpact {
  if (result.riskScore <= 0) return { score: 0, explanation: [] };
  return {
    score: Math.min(18, result.riskScore * 0.25),
    explanation: result.malicious ? [result.providerName + " reported malicious reputation"] : [],
    highSignal: result.malicious,
  };
}

export function calculateIocScoring(results: NormalizedThreatResult[]): IocScoringResult {
  const impacts = results.map((result) => (providerScorers[result.providerId] ?? defaultProviderScore)(result));
  const highSignals = impacts.filter((impact) => impact.highSignal).length;
  const benignSignals = impacts.filter((impact) => impact.benignSignal).length;
  const positiveSignals = impacts.filter((impact) => impact.score > 0).length;
  const rawScore = impacts.reduce((sum, impact) => sum + impact.score, 0);
  let threatScore = clampThreatScore(rawScore);

  if (benignSignals > 0) threatScore = clampThreatScore(threatScore - benignSignals * 18);
  if (positiveSignals === 1 && threatScore > 50) threatScore = 50;
  if (highSignals < 2 && threatScore > 75) threatScore = 75;

  return {
    threatScore,
    riskLevel: riskLevelFromScore(threatScore),
    explanation: unique(impacts.flatMap((impact) => impact.explanation)),
  };
}

export function runIocScoringSelfCheck(log: (message: string) => void = console.debug): void {
  const samples: Array<{ name: string; results: NormalizedThreatResult[] }> = [
    {
      name: "Suspicious IP",
      results: [
        sampleResult("abuseipdb", "AbuseIPDB", 87, true, { data: { abuseConfidenceScore: 87 } }),
        sampleResult("greynoise", "GreyNoise", 80, true, { classification: "malicious" }),
      ],
    },
    {
      name: "Normal domain",
      results: [sampleResult("virustotal", "VirusTotal", 0, false, { data: { attributes: { last_analysis_stats: { malicious: 0, suspicious: 0 } } } })],
    },
    {
      name: "Malicious URL",
      results: [
        sampleResult("virustotal", "VirusTotal", 65, true, { data: { attributes: { last_analysis_stats: { malicious: 3, suspicious: 1, harmless: 15 } } } }),
        sampleResult("urlscan", "URLScan", 72, true, { results: [{ verdicts: { overall: { malicious: true, score: 72 } } }] }),
      ],
    },
  ];

  for (const sample of samples) {
    const first = calculateIocScoring(sample.results);
    const second = calculateIocScoring(sample.results);
    const consistent = JSON.stringify(first) === JSON.stringify(second);
    log("[ioc-scoring] " + sample.name + ": score=" + String(first.threatScore) + ", riskLevel=" + first.riskLevel + ", explanations=" + String(first.explanation.length) + ", consistent=" + String(consistent));
  }
}

function sampleResult(providerId: string, providerName: string, riskScore: number, malicious: boolean, raw: unknown): NormalizedThreatResult {
  return {
    providerId,
    providerName,
    ioc: "sample",
    iocType: "ip",
    riskScore,
    malicious,
    reputation: malicious ? "malicious" : "neutral",
    confidence: 80,
    tags: [],
    categories: [],
    references: [],
    timeline: [],
    raw,
    queriedAt: "2026-01-01T00:00:00.000Z",
  };
}
