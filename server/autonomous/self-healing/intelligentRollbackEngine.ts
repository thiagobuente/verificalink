import { configTuningEngine } from "./configTuningEngine";
import type { HealingChange, HealingConfigState, SystemStateSnapshot } from "./selfHealingTypes";

interface RollbackSnapshot {
  change: HealingChange;
  configBefore: HealingConfigState;
  scoreBefore: number;
  timestamp: number;
}

interface HealingRollbackRecord {
  rollbackId: string;
  change: HealingChange;
  reason: string;
  timestamp: number;
}

const snapshots: RollbackSnapshot[] = [];
const rollbackHistory: HealingRollbackRecord[] = [];

export class IntelligentRollbackEngine {
  capture(change: HealingChange, configBefore: HealingConfigState, stateBefore: SystemStateSnapshot): void {
    snapshots.push({ change, configBefore, scoreBefore: stateBefore.score, timestamp: Date.now() });
    if (snapshots.length > 50) snapshots.shift();
  }

  evaluate(currentState: SystemStateSnapshot): HealingRollbackRecord | undefined {
    const latest = snapshots.at(-1);
    if (!latest) return undefined;
    const worsened = currentState.score + 10 < latest.scoreBefore || currentState.metrics.pipelineLatencyMs > 3000 || currentState.metrics.providerFailureRate > 40;
    if (!worsened) return undefined;
    configTuningEngine.applyConfig(latest.configBefore);
    const rollback = { rollbackId: "healing-rollback:" + String(Date.now()), change: latest.change, reason: "System health worsened after tuning; reverted to previous configuration", timestamp: Date.now() };
    rollbackHistory.push(rollback);
    return rollback;
  }

  history(): HealingRollbackRecord[] {
    return rollbackHistory.slice().reverse();
  }
}

export const intelligentRollbackEngine = new IntelligentRollbackEngine();
