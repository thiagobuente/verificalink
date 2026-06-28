import { continuousSimulationScheduler } from "../simulation/continuousSimulationScheduler";
import { applySingleAdjustment, defaultEvolutionState } from "./evolutionAdjuster";
import type { SOCEvolutionAdjustment, SOCEvolutionMetrics, SOCEvolutionState, SOCVersionedConfig } from "./evolutionModels";
import { rollbackToStable } from "./evolutionRollbackEngine";
import { recommendedAdjustmentFromSimulation } from "./simulationLearningEngine";
import { detectSOCDrift } from "./socDriftDetector";

const history: SOCVersionedConfig[] = [{ version: "soc-config-1", state: defaultEvolutionState, timestamp: Date.now(), stable: true }];
const adjustments: SOCEvolutionAdjustment[] = [];
let lastAdjustmentAt = 0;
let oscillationCooldownUntil = 0;

function metrics(): SOCEvolutionMetrics {
  const runs = continuousSimulationScheduler.list().slice(0, 10);
  const latest = runs[0];
  const previous = runs[1];
  return {
    detectionImprovementRate: latest && previous ? latest.resilienceScore.detectionRate - previous.resilienceScore.detectionRate : 0,
    falsePositiveReduction: latest && previous ? latest.resilienceScore.falsePositiveResistance - previous.resilienceScore.falsePositiveResistance : 0,
    simulationSuccessRate: latest ? latest.resilienceScore.globalThreatResistance : 0,
    stabilityScore: Math.max(0, 100 - detectSOCDrift(runs).driftScore),
  };
}

export class SOCEvolutionEngine {
  currentState(): SOCEvolutionState {
    return history[history.length - 1].state;
  }

  evaluate(): { state: SOCEvolutionState; lastChanges: SOCEvolutionAdjustment[]; driftStatus: ReturnType<typeof detectSOCDrift>; metrics: SOCEvolutionMetrics } {
    const runs = continuousSimulationScheduler.list();
    const driftStatus = detectSOCDrift(runs);
    if (driftStatus.autoAdjustBlocked || Date.now() < oscillationCooldownUntil) {
      const stable = rollbackToStable(history);
      if (stable && stable.version !== history[history.length - 1].version) history.push({ ...stable, version: "rollback-" + String(Date.now()), timestamp: Date.now(), stable: true });
      return { state: this.currentState(), lastChanges: adjustments.slice(-10), driftStatus, metrics: metrics() };
    }
    const latest = runs[0];
    const kind = latest ? recommendedAdjustmentFromSimulation(latest) : undefined;
    if (kind && Date.now() - lastAdjustmentAt >= 60 * 1000) {
      const { state, adjustment } = applySingleAdjustment(this.currentState(), "Simulation learning adjustment", kind);
      const recentDirections = adjustments.slice(-3).map((item) => Math.sign(item.next - item.previous));
      if (recentDirections.length === 3 && recentDirections[0] !== recentDirections[1] && recentDirections[1] !== recentDirections[2]) {
        oscillationCooldownUntil = Date.now() + 5 * 60 * 1000;
      } else {
        history.push({ version: "soc-config-" + String(history.length + 1), state, timestamp: Date.now(), stable: true });
        adjustments.push(adjustment);
        lastAdjustmentAt = Date.now();
      }
    }
    return { state: this.currentState(), lastChanges: adjustments.slice(-10), driftStatus, metrics: metrics() };
  }

  history(): SOCVersionedConfig[] {
    return [...history];
  }
}

export const socEvolutionEngine = new SOCEvolutionEngine();
