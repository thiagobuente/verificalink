import { BaseProvider } from "./BaseProvider";
import type { IocType, NormalizedThreatResult, IocQuery } from "./interfaces/provider";
import { requestJson } from "./services/http";
import { clampScore } from "./services/ioc";

type GreyNoiseResponse = { noise?: boolean; riot?: boolean; classification?: string; name?: string; link?: string; last_seen?: string; message?: string };

export class GreyNoiseProvider extends BaseProvider {
  readonly id = "greynoise";
  readonly name = "GreyNoise";
  readonly timeoutMs = Number(process.env.GREYNOISE_TIMEOUT_MS || 7000);
  readonly supportedTypes: IocType[] = ["ip"];

  isConfigured(): boolean {
    return Boolean(process.env.GREYNOISE_API_KEY);
  }

  async analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult> {
    const started = Date.now();
    try {
      const key = process.env.GREYNOISE_API_KEY;
      if (!key) throw new Error("GREYNOISE_API_KEY not configured");
      const data = await requestJson<GreyNoiseResponse>("https://api.greynoise.io/v3/community/" + encodeURIComponent(query.value), { signal, headers: { key, Accept: "application/json" } });
      const riskScore = clampScore(data.classification === "malicious" ? 80 : data.classification === "suspicious" ? 45 : data.riot ? 5 : data.noise ? 25 : 0);
      const result: NormalizedThreatResult = {
        providerId: this.id,
        providerName: this.name,
        ioc: query.value,
        iocType: query.type,
        riskScore,
        malicious: data.classification === "malicious",
        reputation: data.classification === "malicious" ? "malicious" : data.classification === "suspicious" ? "suspicious" : data.riot ? "trusted" : "neutral",
        confidence: data.message ? 35 : 80,
        tags: [data.classification, data.name, data.noise ? "noise" : undefined, data.riot ? "riot" : undefined].filter(Boolean) as string[],
        categories: data.noise ? ["internet-noise"] : [],
        references: data.link ? [data.link] : [],
        timeline: [{ timestamp: data.last_seen ?? new Date().toISOString(), title: "GreyNoise classification", description: data.classification, source: this.name }],
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
