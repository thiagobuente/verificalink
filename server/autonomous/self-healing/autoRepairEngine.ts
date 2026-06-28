import { configTuningEngine } from "./configTuningEngine";
import type { HealingChange, HealingDecision, SystemStateSnapshot } from "./selfHealingTypes";

export class AutoRepairEngine {
  apply(decision: HealingDecision, systemState: SystemStateSnapshot): HealingChange | undefined {
    if (decision.action !== "tune" || !decision.targetParameter) return undefined;
    return configTuningEngine.tune(decision.targetParameter, systemState, decision.reason);
  }
}

export const autoRepairEngine = new AutoRepairEngine();
