import { BaseProvider } from "./BaseProvider";
import type { IocType, NormalizedThreatResult, IocQuery } from "./interfaces/provider";
import { requestJson } from "./services/http";
import { clampScore } from "./services/ioc";

type OtxPulse = { name?: string; tags?: string[]; modified?: string; references?: string[] };
type OtxResponse = { pulse_info?: { count?: number; pulses?: OtxPulse[] }; country_code?: string; asn?: string; reputation?: number };

function otxType(type: IocType): string {
  if (type === "ip") return "IPv4";
  if (type === "domain") return "domain";
  if (type === "url") return "URL";
  if (type === "hash") return "FileHash";
  return "domain";
}

export class AlienVaultOTXProvider extends BaseProvider {
  readonly id = "alienvault-otx";
  readonly name = "AlienVault OTX";
  readonly timeoutMs = Number(process.env.ALIENVAULT_OTX_TIMEOUT_MS || 7000);
  readonly supportedTypes: IocType[] = ["ip", "domain", "url", "hash"];

  isConfigured(): boolean {
    return Boolean(process.env.ALIENVAULT_OTX_API_KEY);
  }

  async analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    try {
      const key = process.env.ALIENVAULT_OTX_API_KEY;
      if (!key) throw new Error("ALIENVAULT_OTX_API_KEY not configured");
      const url = "https://otx.alienvault.com/api/v1/indicators/" + otxType(query.type) + "/" + encodeURIComponent(query.value) + "/general";
      const data = await requestJson<OtxResponse>(url, { signal, headers: { "X-OTX-API-KEY": key } });
      const pulses = data.pulse_info?.pulses ?? [];
      const pulseCount = data.pulse_info?.count ?? pulses.length;
      const riskScore = clampScore(Math.min(100, pulseCount * 12 + Math.max(0, data.reputation ?? 0)));
      const result: NormalizedThreatResult = {
        providerId: this.id,
        providerName: this.name,
        ioc: query.value,
        iocType: query.type,
        riskScore,
        malicious: riskScore >= 60,
        reputation: riskScore >= 60 ? "malicious" : riskScore >= 20 ? "suspicious" : "neutral",
        confidence: pulseCount > 0 ? 82 : 45,
        country: data.country_code,
        asn: data.asn,
        tags: [...new Set(pulses.flatMap((pulse) => pulse.tags ?? []))],
        categories: pulses.map((pulse) => pulse.name).filter(Boolean) as string[],
        references: [...new Set(pulses.flatMap((pulse) => pulse.references ?? []))],
        timeline: pulses.slice(0, 5).map((pulse) => ({ timestamp: pulse.modified ?? new Date().toISOString(), title: pulse.name ?? "OTX pulse", source: this.name })),
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
