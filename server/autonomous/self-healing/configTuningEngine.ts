import { guardConfig, guardParameter } from "./safeParameterGuard";
import { defaultHealingConfig, type HealingChange, type HealingConfigState, type SystemStateSnapshot, type TunableParameter } from "./selfHealingTypes";

let currentConfig: HealingConfigState = { ...defaultHealingConfig };
const changes: HealingChange[] = [];

function nextValue(parameter: TunableParameter, state: SystemStateSnapshot): number {
  const current = currentConfig[parameter];
  if (parameter === "providerTimeoutMs") return state.metrics.providerFailureRate > 20 ? current + 500 : current - 250;
  if (parameter === "retryCount") return state.metrics.providerFailureRate > 35 ? current + 1 : current;
  if (parameter === "cacheTtlMs") return state.metrics.pipelineLatencyMs > 2000 ? current + 30000 : current;
  if (parameter === "correlationThreshold") return state.metrics.driftInstability > 0 ? current + 5 : current;
  if (parameter === "alertSensitivity") return state.metrics.automationErrors > 3 ? current - 0.05 : current;
  if (parameter === "driftSensitivity") return state.metrics.driftInstability > 0 ? current - 0.05 : current;
  return current;
}

export class ConfigTuningEngine {
  current(): HealingConfigState {
    return guardConfig(currentConfig);
  }

  preview(parameter: TunableParameter, state: SystemStateSnapshot): { previous: number; next: number } {
    const previous = Number(currentConfig[parameter]);
    const guarded = guardParameter(parameter, nextValue(parameter, state));
    return { previous, next: guarded.value };
  }

  tune(parameter: TunableParameter, state: SystemStateSnapshot, reason: string): HealingChange {
    const previous = Number(currentConfig[parameter]);
    const guarded = guardParameter(parameter, nextValue(parameter, state));
    currentConfig = guardConfig({ ...currentConfig, [parameter]: guarded.value });
    const change = { id: [parameter, Date.now()].join(":"), parameter, previous, next: guarded.value, reason: guarded.reasons.join("; ") + "; " + reason, timestamp: Date.now() };
    changes.push(change);
    if (changes.length > 100) changes.shift();
    return change;
  }

  applyConfig(config: HealingConfigState): void {
    currentConfig = guardConfig(config);
  }

  changes(): HealingChange[] {
    return [...changes].reverse();
  }
}

export const configTuningEngine = new ConfigTuningEngine();
