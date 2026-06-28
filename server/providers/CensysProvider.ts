import { BaseProvider } from "./BaseProvider";
import type { IocType, NormalizedThreatResult, IocQuery } from "./interfaces/provider";
import { requestJson } from "./services/http";
import { clampScore } from "./services/ioc";

type CensysService = { service_name?: string; port?: number };
type CensysResponse = { result?: { location?: { country_code?: string }; autonomous_system?: { asn?: number; name?: string }; services?: CensysService[]; labels?: string[]; last_updated_at?: string } };

function buildCensysAuthHeaders(): Record<string, string> {
  const apiKey = process.env.CENSYS_API_KEY;
  if (apiKey) return { Authorization: "Bearer " + apiKey };

  const id = process.env.CENSYS_API_ID;
  const secret = process.env.CENSYS_API_SECRET;
  if (!id || !secret) throw new Error("CENSYS_API_KEY or CENSYS_API_ID/CENSYS_API_SECRET not configured");
  return { Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64") };
}

export class CensysProvider extends BaseProvider {
  readonly id = "censys";
  readonly name = "Censys";
  readonly timeoutMs = Number(process.env.CENSYS_TIMEOUT_MS || 8000);
  readonly supportedTypes: IocType[] = ["ip"];

  isConfigured(): boolean {
    return Boolean(process.env.CENSYS_API_KEY || (process.env.CENSYS_API_ID && process.env.CENSYS_API_SECRET));
  }

  async analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    try {
      const data = await requestJson<CensysResponse>("https://search.censys.io/api/v2/hosts/" + encodeURIComponent(query.value), { signal, headers: buildCensysAuthHeaders() });
      const resultData = data.result ?? {};
      const serviceCount = resultData.services?.length ?? 0;
      const riskScore = clampScore(serviceCount * 8 + (resultData.labels?.includes("malware") ? 50 : 0));
      const result: NormalizedThreatResult = {
        providerId: this.id,
        providerName: this.name,
        ioc: query.value,
        iocType: query.type,
        riskScore,
        malicious: resultData.labels?.includes("malware") ?? false,
        reputation: riskScore >= 60 ? "malicious" : riskScore >= 25 ? "suspicious" : "neutral",
        confidence: 76,
        country: resultData.location?.country_code,
        asn: resultData.autonomous_system ? String(resultData.autonomous_system.asn ?? "") + " " + (resultData.autonomous_system.name ?? "") : undefined,
        tags: resultData.labels ?? [],
        categories: (resultData.services ?? []).map((service) => service.service_name ?? String(service.port)).filter(Boolean),
        references: ["https://search.censys.io/hosts/" + encodeURIComponent(query.value)],
        timeline: [{ timestamp: resultData.last_updated_at ?? new Date().toISOString(), title: "Censys host profile", description: String(serviceCount) + " observed services", source: this.name }],
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
