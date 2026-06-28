import type { HealingConfigState, HealingImpactSimulation, SystemStateSnapshot, TunableParameter } from "./selfHealingTypes";

export function simulateHealingImpact(input: { parameter: TunableParameter; previous: number; next: number; config: HealingConfigState; systemState: SystemStateSnapshot }): HealingImpactSimulation {
  const delta = input.next - input.previous;
  const reasons: string[] = [];
  let latencyImpact = 0;
  let falsePositiveImpact = 0;
  if (input.parameter === "providerTimeoutMs") {
    latencyImpact = delta > 0 ? 4 : -6;
    reasons.push(delta > 0 ? "Longer timeout may reduce provider failures but increase latency" : "Shorter timeout may reduce latency but increase provider fallback use");
  }
  if (input.parameter === "retryCount") {
    latencyImpact = delta > 0 ? 5 : -4;
    reasons.push("Retry changes affect latency and provider stability");
  }
  if (input.parameter === "correlationThreshold") {
    falsePositiveImpact = delta > 0 ? -8 : 8;
    reasons.push(delta > 0 ? "Higher threshold should reduce false positives" : "Lower threshold may improve detection but increase noise");
  }
  if (input.parameter === "alertSensitivity" || input.parameter === "driftSensitivity") {
    falsePositiveImpact = delta > 0 ? 6 : -6;
    reasons.push("Sensitivity changes affect alert volume and drift response");
  }
  if (input.parameter === "cacheTtlMs") {
    latencyImpact = delta > 0 ? -5 : 3;
    reasons.push("Cache TTL changes affect response speed and freshness");
  }
  const highRisk = Math.abs(delta) > Math.max(1, input.previous * 0.25) || input.systemState.state === "critical";
  return { latencyImpact, falsePositiveImpact, risk: highRisk ? "high" : Math.abs(delta) > Math.max(1, input.previous * 0.1) ? "medium" : "low", safe: !highRisk, reasons };
}
