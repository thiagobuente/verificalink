import { BaseProvider } from "./BaseProvider";
import type { IocType, NormalizedThreatResult, IocQuery } from "./interfaces/provider";
import { requestJson } from "./services/http";
import { clampScore } from "./services/ioc";

type ShodanResponse = { ip_str?: string; country_code?: string; asn?: string; org?: string; hostnames?: string[]; tags?: string[]; vulns?: Record<string, unknown>; ports?: number[]; last_update?: string };

export class ShodanProvider extends BaseProvider {
  readonly id = "shodan";
  readonly name = "Shodan";
  readonly timeoutMs = Number(process.env.SHODAN_TIMEOUT_MS || 8000);
  readonly supportedTypes: IocType[] = ["ip"];

  isConfigured(): boolean {
    return Boolean(process.env.SHODAN_API_KEY);
  }

  async analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    try {
      const key = process.env.SHODAN_API_KEY;
      if (!key) throw new Error("SHODAN_API_KEY not configured");
      const data = await requestJson<ShodanResponse>("https://api.shodan.io/shodan/host/" + encodeURIComponent(query.value) + "?key=" + encodeURIComponent(key), { signal });
      const vulnCount = Object.keys(data.vulns ?? {}).length;
      const riskScore = clampScore(vulnCount * 20 + (data.ports?.length ?? 0));
      const result: NormalizedThreatResult = {
        providerId: this.id,
        providerName: this.name,
        ioc: query.value,
        iocType: query.type,
        riskScore,
        malicious: vulnCount >= 3,
        reputation: vulnCount >= 3 ? "malicious" : vulnCount > 0 ? "suspicious" : "neutral",
        confidence: 78,
        country: data.country_code,
        asn: [data.asn, data.org].filter(Boolean).join(" ") || undefined,
        tags: [...(data.tags ?? []), ...(data.hostnames ?? [])],
        categories: vulnCount > 0 ? ["exposed-services", "vulnerabilities"] : ["exposed-services"],
        references: ["https://www.shodan.io/host/" + encodeURIComponent(query.value)],
        timeline: [{ timestamp: data.last_update ?? new Date().toISOString(), title: "Shodan host profile", description: String(data.ports?.length ?? 0) + " open ports", source: this.name }],
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
