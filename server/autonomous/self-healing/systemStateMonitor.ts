import { getStabilityMode } from "../../command-center/stabilityModeController";
import { socObservabilityCore } from "../../observability/socObservabilityCore";
import { getSOCMetrics } from "../../providers";
import type { SystemStateSnapshot, SOCSystemState } from "./selfHealingTypes";

function avgMetric(metricName: string): number {
  const snapshot = socObservabilityCore.snapshot();
  const metric = snapshot.metrics.histograms.find((item) => item.metricKey.startsWith(metricName + ":"));
  return metric?.avg ?? 0;
}

function stateFromScore(score: number, unstable: boolean): SOCSystemState {
  if (score < 40) return "critical";
  if (unstable) return "unstable";
  if (score < 75) return "degraded";
  return "healthy";
}

export class SystemStateMonitor {
  snapshot(): SystemStateSnapshot {
    const metrics = getSOCMetrics();
    const pipelineLatencyMs = Math.max(avgMetric("ioc_response_ms"), avgMetric("correlation_ms"), metrics.averageCorrelationLatencyMs);
    const providerFailureRate = metrics.providerFailureRate;
    const commandCenterDegraded = getStabilityMode() !== "normal";
    const automationErrors = Object.entries(metrics.actionDistribution).filter(([key]) => key.includes("blocked") || key.includes("failed")).reduce((sum, [, value]) => sum + value, 0);
    const driftInstability = commandCenterDegraded ? 30 : 0;
    const reasons: string[] = [];
    let score = 100;
    if (pipelineLatencyMs > 2000) { score -= 20; reasons.push("Pipeline latency is above target"); }
    if (providerFailureRate > 20) { score -= Math.min(30, providerFailureRate); reasons.push("Provider failure rate is elevated"); }
    if (commandCenterDegraded) { score -= 20; reasons.push("Command center is degraded or in recovery"); }
    if (automationErrors > 3) { score -= 15; reasons.push("Automation errors increased"); }
    if (driftInstability > 0) reasons.push("Drift or stability mode indicates instability");
    const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
    return {
      state: stateFromScore(boundedScore, commandCenterDegraded && boundedScore < 75),
      score: boundedScore,
      reasons: reasons.length ? reasons : ["SOC operating within expected ranges"],
      metrics: { pipelineLatencyMs, providerFailureRate, driftInstability, commandCenterDegraded, automationErrors },
      timestamp: Date.now(),
    };
  }
}

export const systemStateMonitor = new SystemStateMonitor();
