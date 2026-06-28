import { getSOCMetrics } from "../providers/storage/metrics";
import type { ProviderHealthSnapshot } from "../providers/interfaces/provider";
import { getStabilityMode, updateStabilityMode } from "./stabilityModeController";

export function buildSOCSystemHealth(providers: ProviderHealthSnapshot[]) {
  const metrics = getSOCMetrics();
  const feedEmptyCycles = metrics.incidentThroughput === 0 ? 3 : 0;
  const mode = updateStabilityMode({ feedEmptyCycles });
  return {
    providers: providers.map((provider) => ({ id: provider.id, name: provider.name, status: provider.status, latency: provider.latency, errors: provider.errors })),
    correlationLatency: metrics.averageCorrelationLatencyMs,
    providerFailureRate: metrics.providerFailureRate,
    aiOperatorAdjustments: metrics.aiOperatorAdjustments,
    eventQueue: metrics.incidentThroughput,
    mode,
    updateFrequency: getStabilityMode() === "normal" ? "realtime" : "reduced",
  };
}
