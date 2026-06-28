import { BaseProvider } from "./BaseProvider";
import type { IocType, NormalizedThreatResult, IocQuery } from "./interfaces/provider";
import { requestJson } from "./services/http";
import { clampScore } from "./services/ioc";

type AbuseResponse = { data?: { abuseConfidenceScore?: number; countryCode?: string; isp?: string; usageType?: string; domain?: string; totalReports?: number } };

export class AbuseIPDBProvider extends BaseProvider {
  readonly id = "abuseipdb";
  readonly name = "AbuseIPDB";
  readonly timeoutMs = Number(process.env.ABUSEIPDB_TIMEOUT_MS || 7000);
  readonly supportedTypes: IocType[] = ["ip"];

  isConfigured(): boolean {
    return Boolean(process.env.ABUSEIPDB_API_KEY);
  }

  async analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    try {
      const key = process.env.ABUSEIPDB_API_KEY;
      if (!key) throw new Error("ABUSEIPDB_API_KEY not configured");
      const url = "https://api.abuseipdb.com/api/v2/check?ipAddress=" + encodeURIComponent(query.value) + "&maxAgeInDays=90&verbose=true";
      const data = await requestJson<AbuseResponse>(url, { signal, headers: { Key: key, Accept: "application/json" } });
      const item = data.data ?? {};
      const riskScore = clampScore(item.abuseConfidenceScore ?? 0);
      const result: NormalizedThreatResult = {
        providerId: this.id,
        providerName: this.name,
        ioc: query.value,
        iocType: query.type,
        riskScore,
        malicious: riskScore >= 60,
        reputation: riskScore >= 60 ? "malicious" : riskScore >= 25 ? "suspicious" : "neutral",
        confidence: 85,
        country: item.countryCode,
        asn: item.isp,
        tags: [item.usageType, item.domain].filter(Boolean) as string[],
        categories: item.totalReports ? ["abuse-reports"] : [],
        references: ["https://www.abuseipdb.com/check/" + encodeURIComponent(query.value)],
        timeline: [{ timestamp: new Date().toISOString(), title: "AbuseIPDB reputation checked", description: String(item.totalReports ?? 0) + " reports", source: this.name }],
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
