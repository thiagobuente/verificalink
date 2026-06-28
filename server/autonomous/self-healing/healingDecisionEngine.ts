import type { HealingDecision, SystemStateSnapshot } from "./selfHealingTypes";

export class HealingDecisionEngine {
  decide(systemState: SystemStateSnapshot): HealingDecision {
    if (systemState.state === "healthy") return { action: "no_action", confidence: 95, reason: "System is healthy" };
    if (systemState.state === "critical") return { action: "recovery_mode", confidence: 92, reason: "Critical system state requires recovery mode" };
    if (systemState.metrics.providerFailureRate > 20) return { action: "tune", confidence: 84, reason: "Provider failures indicate timeout or retry tuning", targetParameter: "providerTimeoutMs" };
    if (systemState.metrics.pipelineLatencyMs > 2000) return { action: "tune", confidence: 80, reason: "Pipeline latency indicates cache or timeout tuning", targetParameter: "cacheTtlMs" };
    if (systemState.metrics.driftInstability > 0) return { action: "rollback", confidence: 78, reason: "Drift instability suggests recent tuning may have degraded behavior" };
    if (systemState.metrics.automationErrors > 3) return { action: "tune", confidence: 72, reason: "Automation errors suggest alert sensitivity tuning", targetParameter: "alertSensitivity" };
    return { action: "no_action", confidence: 60, reason: "No high-confidence healing action found" };
  }
}

export const healingDecisionEngine = new HealingDecisionEngine();
