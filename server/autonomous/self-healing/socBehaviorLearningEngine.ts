import type { SystemStateSnapshot, TunableParameter } from "./selfHealingTypes";

interface ProviderReliability {
  provider: string;
  successes: number;
  failures: number;
}

const thresholdScores = new Map<TunableParameter, number[]>();
const providerReliability = new Map<string, ProviderReliability>();
const attackPatterns = new Map<string, number>();

export class SOCBehaviorLearningEngine {
  recordThresholdOutcome(parameter: TunableParameter, score: number): void {
    const values = thresholdScores.get(parameter) ?? [];
    values.push(score);
    if (values.length > 50) values.shift();
    thresholdScores.set(parameter, values);
  }

  recordProvider(provider: string, success: boolean): void {
    const current = providerReliability.get(provider) ?? { provider, successes: 0, failures: 0 };
    providerReliability.set(provider, { ...current, successes: current.successes + (success ? 1 : 0), failures: current.failures + (success ? 0 : 1) });
  }

  recordAttackPattern(pattern: string): void {
    attackPatterns.set(pattern, (attackPatterns.get(pattern) ?? 0) + 1);
  }

  recommendParameter(state: SystemStateSnapshot): TunableParameter | undefined {
    if (state.metrics.providerFailureRate > 25) return "providerTimeoutMs";
    if (state.metrics.pipelineLatencyMs > 2500) return "cacheTtlMs";
    if (state.metrics.driftInstability > 0) return "correlationThreshold";
    if (state.metrics.automationErrors > 3) return "alertSensitivity";
    return undefined;
  }

  summary() {
    return {
      thresholdOutcomes: [...thresholdScores.entries()].map(([parameter, scores]) => ({ parameter, avgScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0 })),
      providerReliability: [...providerReliability.values()],
      recurringAttackPatterns: [...attackPatterns.entries()].map(([pattern, count]) => ({ pattern, count })).sort((left, right) => right.count - left.count).slice(0, 10),
    };
  }
}

export const socBehaviorLearningEngine = new SOCBehaviorLearningEngine();
