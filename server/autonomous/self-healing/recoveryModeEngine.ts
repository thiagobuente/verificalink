import { configTuningEngine } from "./configTuningEngine";
import type { HealingConfigState, SystemStateSnapshot } from "./selfHealingTypes";

let recoveryActive = false;
let lastActivatedAt = 0;
let previousConfig: HealingConfigState | undefined;

export class RecoveryModeEngine {
  activate(systemState: SystemStateSnapshot, reason: string) {
    if (!recoveryActive) previousConfig = configTuningEngine.current();
    recoveryActive = true;
    lastActivatedAt = Date.now();
    const current = configTuningEngine.current();
    configTuningEngine.applyConfig({
      ...current,
      autoTuningEnabled: false,
      fallbackLevel: "maximum",
      pipelineComplexity: "reduced",
      retryCount: Math.min(current.retryCount, 1),
      providerTimeoutMs: Math.min(current.providerTimeoutMs, 5000),
      alertSensitivity: Math.max(current.alertSensitivity, 0.7),
    });
    return { active: recoveryActive, reason, state: systemState.state, actions: ["disable auto-tuning", "activate maximum fallback", "reduce pipeline complexity"] };
  }

  deactivate() {
    recoveryActive = false;
    if (previousConfig) configTuningEngine.applyConfig(previousConfig);
    return { active: recoveryActive, restored: Boolean(previousConfig) };
  }

  status() {
    return { active: recoveryActive, lastActivatedAt, config: configTuningEngine.current() };
  }
}

export const recoveryModeEngine = new RecoveryModeEngine();
