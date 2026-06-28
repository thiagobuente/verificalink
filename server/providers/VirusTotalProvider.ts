import { BaseProvider } from "./BaseProvider";
import type { IocType, NormalizedThreatResult, IocQuery } from "./interfaces/provider";
import { requestJson } from "./services/http";
import { base64Url, clampScore } from "./services/ioc";

type VirusTotalStats = { malicious?: number; suspicious?: number; harmless?: number; undetected?: number };
type VirusTotalResponse = { data?: { id?: string; attributes?: { last_analysis_stats?: VirusTotalStats; reputation?: number; country?: string; as_owner?: string; tags?: string[]; categories?: Record<string, string> } } };

export class VirusTotalProvider extends BaseProvider {
  readonly id = "virustotal";
  readonly name = "VirusTotal";
  readonly timeoutMs = Number(process.env.VIRUSTOTAL_TIMEOUT_MS || 8000);
  readonly supportedTypes: IocType[] = ["ip", "domain", "url", "hash"];

  isConfigured(): boolean {
    return Boolean(process.env.VIRUSTOTAL_API_KEY);
  }

  async analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    try {
      const key = process.env.VIRUSTOTAL_API_KEY;
      if (!key) throw new Error("VIRUSTOTAL_API_KEY not configured");
      const endpoint = query.type === "ip" ? "ip_addresses/" + encodeURIComponent(query.value)
        : query.type === "domain" ? "domains/" + encodeURIComponent(query.value)
        : query.type === "url" ? "urls/" + base64Url(query.value)
        : "files/" + encodeURIComponent(query.value);
      const data = await requestJson<VirusTotalResponse>("https://www.virustotal.com/api/v3/" + endpoint, { signal, headers: { "x-apikey": key } });
      const attrs = data.data?.attributes ?? {};
      const stats = attrs.last_analysis_stats ?? {};
      const detections = (stats.malicious ?? 0) + (stats.suspicious ?? 0);
      const total = detections + (stats.harmless ?? 0) + (stats.undetected ?? 0);
      const riskScore = clampScore(total > 0 ? (detections / total) * 100 : Math.max(0, -(attrs.reputation ?? 0)));
      const result: NormalizedThreatResult = {
        providerId: this.id,
        providerName: this.name,
        ioc: query.value,
        iocType: query.type,
        riskScore,
        malicious: riskScore >= 60,
        reputation: riskScore >= 60 ? "malicious" : riskScore >= 25 ? "suspicious" : "neutral",
        confidence: total > 0 ? 90 : 55,
        country: attrs.country,
        asn: attrs.as_owner,
        tags: attrs.tags ?? [],
        categories: Object.values(attrs.categories ?? {}),
        references: data.data?.id ? ["https://www.virustotal.com/gui/search/" + encodeURIComponent(query.value)] : [],
        timeline: [{ timestamp: new Date().toISOString(), title: "VirusTotal analysis completed", source: this.name }],
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
