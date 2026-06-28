import type { IocCorrelationResult, IocTimelineEvent, IocType, Severity } from "./types";

const sampleSources = ["VirusTotal", "Shodan", "GreyNoise", "AbuseIPDB", "AlienVault OTX", "Censys"];

export function detectIocType(value: string): IocType {
  const normalized = value.trim();
  if (/^[a-f0-9]{32,64}$/i.test(normalized)) return "hash";
  if (/^https?:\/\//i.test(normalized)) return "url";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return "email";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)) return "ip";
  return "domain";
}

function severityFromScore(score: number): Severity {
  if (score >= 75) return "danger";
  if (score >= 40) return "warning";
  return "safe";
}

function stableScore(value: string) {
  const total = value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 28 + (total % 68);
}

export function correlateIoc(query: string): IocCorrelationResult {
  const type = detectIocType(query);
  const score = stableScore(query || "shield");
  const severity = severityFromScore(score);
  const base = query.replace(/^https?:\/\//, "").split("/")[0] || "unknown.local";
  const timeline: IocTimelineEvent[] = [
    { id: "t1", timestamp: "T-72h", title: "Primeira observação", detail: "Indicador observado em fonte de reputação externa.", source: "AlienVault OTX", severity: "neutral" },
    { id: "t2", timestamp: "T-24h", title: "Correlação de infraestrutura", detail: "Relação com domínio, IP ou hash previamente sinalizado.", source: "Censys", severity: score > 50 ? "warning" : "safe" },
    { id: "t3", timestamp: "T-2h", title: "Atividade recente", detail: "Novo evento associado ao indicador consultado.", source: "GreyNoise", severity },
  ];

  return {
    query,
    type,
    riskScore: score,
    severity,
    sources: sampleSources,
    relationships: [
      { id: "r1", type: "domain", value: base, relation: "resolves-to", confidence: 92, source: "Censys" },
      { id: "r2", type: "ip", value: "185.199.108." + String((score % 80) + 10), relation: "hosted-on", confidence: 86, source: "Shodan" },
      { id: "r3", type: "hash", value: "a7c9f41e" + String(score) + "9b20", relation: "downloaded-payload", confidence: 74, source: "VirusTotal" },
      { id: "r4", type: "email", value: "alerts@" + base.replace(/^www\./, ""), relation: "campaign-contact", confidence: 61, source: "AbuseIPDB" },
    ],
    relatedIndicators: [base, "185.199.108." + String((score % 80) + 10), "a7c9f41e" + String(score) + "9b20", "alerts@" + base.replace(/^www\./, "")],
    timeline,
  };
}
