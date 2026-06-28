import { BaseProvider } from "./BaseProvider";
import type { IocType, NormalizedThreatResult, IocQuery } from "./interfaces/provider";
import { requestJson } from "./services/http";
import { clampScore } from "./services/ioc";

type UrlScanResult = { task?: { time?: string; url?: string }; page?: { domain?: string; country?: string; asnname?: string }; verdicts?: { overall?: { malicious?: boolean; score?: number; categories?: string[]; tags?: string[] } }; result?: string };
type UrlScanResponse = { total?: number; results?: UrlScanResult[] };

function queryFor(type: IocType, value: string): string {
  if (type === "domain") return "domain:" + value;
  if (type === "ip") return "ip:" + value;
  if (type === "url") return "page.url:" + value;
  return value;
}

export class URLScanProvider extends BaseProvider {
  readonly id = "urlscan";
  readonly name = "URLScan";
  readonly timeoutMs = Number(process.env.URLSCAN_TIMEOUT_MS || 7000);
  readonly supportedTypes: IocType[] = ["ip", "domain", "url"];

  isConfigured(): boolean {
    return true;
  }

  async analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (process.env.URLSCAN_API_KEY) headers["API-Key"] = process.env.URLSCAN_API_KEY;
      const url = "https://urlscan.io/api/v1/search/?q=" + encodeURIComponent(queryFor(query.type, query.value));
      const data = await requestJson<UrlScanResponse>(url, { signal, headers });
      const results = data.results ?? [];
      const first = results[0];
      const maliciousCount = results.filter((item) => item.verdicts?.overall?.malicious).length;
      const score = first?.verdicts?.overall?.score ?? maliciousCount * 20;
      const riskScore = clampScore(score);
      const result: NormalizedThreatResult = {
        providerId: this.id,
        providerName: this.name,
        ioc: query.value,
        iocType: query.type,
        riskScore,
        malicious: maliciousCount > 0 || riskScore >= 60,
        reputation: maliciousCount > 0 || riskScore >= 60 ? "malicious" : riskScore >= 25 ? "suspicious" : "neutral",
        confidence: results.length > 0 ? 72 : 35,
        country: first?.page?.country,
        asn: first?.page?.asnname,
        tags: first?.verdicts?.overall?.tags ?? [],
        categories: first?.verdicts?.overall?.categories ?? [],
        references: results.map((item) => item.result).filter(Boolean) as string[],
        timeline: results.slice(0, 5).map((item) => ({ timestamp: item.task?.time ?? new Date().toISOString(), title: item.task?.url ?? "URLScan observation", source: this.name })),
        raw: data,
        queriedAt: new Date().toISOString(),
      };
      this.markSuccess(Date.now() - started);
      return result;
    } catch (error) {
      this.markFailure(error);
      throw error;
    }
  }
}
