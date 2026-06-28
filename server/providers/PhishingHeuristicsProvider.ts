import { BaseProvider } from "./BaseProvider";
import type { IocQuery, IocType, NormalizedThreatResult } from "./interfaces/provider";
import { clampScore } from "./services/ioc";

interface HeuristicSignal {
  score: number;
  tag: string;
  category: string;
  explanation: string;
}

const trustedDomains = new Set([
  "google.com", "gmail.com", "youtube.com", "microsoft.com", "office.com", "outlook.com",
  "github.com", "linkedin.com", "apple.com", "icloud.com", "amazon.com", "paypal.com",
  "nubank.com.br", "itau.com.br", "bradesco.com.br", "bb.com.br", "caixa.gov.br", "gov.br",
]);

const knownBrands = [
  "google", "microsoft", "whatsapp", "paypal", "amazon", "apple", "github", "nubank",
  "itau", "bradesco", "caixa", "santander", "mercadolivre", "gov", "receita", "correios",
];

const homoglyphMap: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
};

const sensitiveParams = ["token", "session", "auth", "password", "passwd", "senha", "otp", "code", "verify", "redirect", "return", "callback"];
const urgencyWords = ["urgent", "urgente", "verify", "verificar", "confirm", "confirmar", "update", "atualizar", "blocked", "bloqueado", "security", "seguranca", "premio", "bonus", "limited", "expira"];

function hostnameFrom(value: string, type: IocType): string {
  try {
    if (type === "url") return new URL(value).hostname.toLowerCase();
    return new URL("https://" + value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase().replace(new RegExp("^https?://"), "").split("/")[0] ?? value.toLowerCase();
  }
}

function mainDomain(hostname: string): string {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) return hostname;
  const suffix = parts.slice(-2).join(".");
  if (["com.br", "gov.br", "org.br", "net.br"].includes(suffix) && parts.length >= 3) return parts.slice(-3).join(".");
  return suffix;
}

function normalizeBrandCandidate(value: string): string {
  return value.toLowerCase().split("").map((char) => homoglyphMap[char] ?? char).join("").replace(/[^a-z]/g, "");
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return matrix[a.length][b.length];
}

function hasRecentWhoisSignal(value: string): boolean {
  const raw = process.env.PHISHING_WHOIS_HINTS;
  if (!raw) return false;
  try {
    const hints = JSON.parse(raw) as Record<string, { createdAt?: string; ageDays?: number }>;
    const hint = hints[value];
    if (!hint) return false;
    if (typeof hint.ageDays === "number") return hint.ageDays >= 0 && hint.ageDays <= 30;
    if (hint.createdAt) {
      const ageDays = (Date.now() - new Date(hint.createdAt).getTime()) / 86400000;
      return Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= 30;
    }
  } catch {
    return false;
  }
  return false;
}

function analyzeHeuristics(value: string, type: IocType): HeuristicSignal[] {
  if (type !== "domain" && type !== "url") return [];
  const hostname = hostnameFrom(value, type);
  const domain = mainDomain(hostname);
  if (trustedDomains.has(domain) || trustedDomains.has(hostname)) return [];

  const signals: HeuristicSignal[] = [];
  const labels = hostname.split(".").filter(Boolean);
  const registrableLabel = domain.split(".")[0] ?? domain;
  const normalizedLabel = normalizeBrandCandidate(registrableLabel);
  const normalizedHost = normalizeBrandCandidate(hostname);

  for (const brand of knownBrands) {
    if (registrableLabel === brand || domain === brand + ".com" || domain === brand + ".com.br") continue;
    const distance = levenshtein(normalizedLabel, brand);
    const brandInHost = normalizedHost.includes(brand) && !hostname.includes(brand + ".");
    if ((distance > 0 && distance <= 2) || brandInHost) {
      signals.push({ score: 35, tag: "typosquatting", category: "phishing", explanation: "Domain resembles a known brand using typo, homoglyph or numeric substitution" });
      break;
    }
  }

  const longSubdomain = labels.length >= 5 || labels.some((label) => label.length >= 28);
  if (longSubdomain) signals.push({ score: 16, tag: "long-subdomain", category: "evasion", explanation: "URL uses unusually long or deeply nested subdomains" });

  if (hasRecentWhoisSignal(domain) || hasRecentWhoisSignal(hostname)) {
    signals.push({ score: 22, tag: "recent-domain", category: "reputation", explanation: "WHOIS data indicates a recently created domain" });
  }

  if (type === "url") {
    let parsed: URL | undefined;
    try { parsed = new URL(value); } catch { parsed = undefined; }
    if (parsed) {
      const redirectMarkers = ["redirect", "redir", "url", "target", "next", "return", "continue"].filter((param) => parsed.searchParams.has(param));
      if (redirectMarkers.length >= 2 || new RegExp("/(redirect|redir|go|out|click)", "i").test(parsed.pathname)) {
        signals.push({ score: 20, tag: "redirect-chain", category: "redirect", explanation: "URL contains redirect markers often used to hide the final destination" });
      }
      const sensitive = sensitiveParams.filter((param) => parsed.searchParams.has(param) || parsed.search.toLowerCase().includes(param + "="));
      if (sensitive.length > 0) signals.push({ score: 14, tag: "sensitive-params", category: "credential-risk", explanation: "URL contains sensitive authentication or verification parameters" });
      const urgent = urgencyWords.filter((word) => value.toLowerCase().includes(word));
      if (urgent.length > 0) signals.push({ score: 12, tag: "urgency-language", category: "social-engineering", explanation: "URL contains urgency or phishing-oriented language" });
    }
  }

  return signals;
}

export class PhishingHeuristicsProvider extends BaseProvider {
  readonly id = "phishing-heuristics";
  readonly name = "Phishing Heuristics";
  readonly timeoutMs = Number(process.env.PHISHING_HEURISTICS_TIMEOUT_MS || 1000);
  readonly supportedTypes: IocType[] = ["domain", "url"];

  isConfigured(): boolean {
    return true;
  }

  async analyze(query: Required<IocQuery>, _signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    const signals = analyzeHeuristics(query.value, query.type);
    const riskScore = clampScore(signals.reduce((sum, signal) => sum + signal.score, 0));
    const malicious = riskScore >= 70;
    const result: NormalizedThreatResult = {
      providerId: this.id,
      providerName: this.name,
      ioc: query.value,
      iocType: query.type,
      riskScore,
      malicious,
      reputation: malicious ? "malicious" : riskScore >= 30 ? "suspicious" : riskScore <= 5 ? "trusted" : "neutral",
      confidence: signals.length > 0 ? 68 : 45,
      tags: [...new Set(signals.map((signal) => signal.tag))],
      categories: [...new Set(signals.map((signal) => signal.category))],
      references: [],
      timeline: signals.map((signal) => ({ timestamp: new Date().toISOString(), title: signal.explanation, source: this.name })),
      raw: { signals },
      queriedAt: new Date().toISOString(),
    };
    this.markSuccess(Date.now() - started);
    return result;
  }
}
