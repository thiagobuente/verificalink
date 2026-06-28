import { autoRepairEngine } from "./autoRepairEngine";
import { configTuningEngine } from "./configTuningEngine";
import { healingDecisionEngine } from "./healingDecisionEngine";
import { simulateHealingImpact } from "./healingImpactSimulator";
import { healingLoopController } from "./healingLoopController";
import { healingAuditLogger } from "./healingAuditLogger";
import { intelligentRollbackEngine } from "./intelligentRollbackEngine";
import { recoveryModeEngine } from "./recoveryModeEngine";
import { evaluateSelfHealingSafety } from "./selfHealingSafetyRules";
import { socBehaviorLearningEngine } from "./socBehaviorLearningEngine";
import { systemStateMonitor } from "./systemStateMonitor";
import type { HealingChange, HealingDecision, SystemStateSnapshot } from "./selfHealingTypes";

export interface SelfHealingRunResult {
  systemState: SystemStateSnapshot;
  decision: HealingDecision;
  applied: boolean;
  change?: HealingChange;
  rollback?: ReturnType<typeof intelligentRollbackEngine.evaluate>;
  recovery?: ReturnType<typeof recoveryModeEngine.activate>;
  reasons: string[];
}

export class SOCSelfHealingEngine {
  run(): SelfHealingRunResult {
    const systemState = systemStateMonitor.snapshot();
    const rollback = intelligentRollbackEngine.evaluate(systemState);
    if (rollback) {
      healingAuditLogger.log({ action: "rollback", reason: rollback.reason, expectedImpact: "Restore last stable self-healing configuration", realResult: "Rollback applied", change: rollback.change, systemState: systemState.state });
      return { systemState, decision: { action: "rollback", confidence: 90, reason: rollback.reason }, applied: true, rollback, reasons: [rollback.reason] };
    }

    const decision = healingDecisionEngine.decide(systemState);
    if (decision.action === "recovery_mode") {
      const recovery = recoveryModeEngine.activate(systemState, decision.reason);
      healingLoopController.record(true);
      healingAuditLogger.log({ action: "recovery_mode", reason: decision.reason, expectedImpact: "Stabilize SOC by reducing complexity and disabling auto-tuning", realResult: "Recovery mode active", systemState: systemState.state });
      return { systemState, decision, applied: true, recovery, reasons: [decision.reason] };
    }

    if (decision.action === "no_action") {
      healingAuditLogger.log({ action: "no_action", reason: decision.reason, expectedImpact: "No configuration change", realResult: "No action taken", systemState: systemState.state });
      return { systemState, decision, applied: false, reasons: [decision.reason] };
    }

    const loop = healingLoopController.canRun();
    const configBefore = configTuningEngine.current();
    const parameter = decision.targetParameter;
    if (!parameter) return { systemState, decision, applied: false, reasons: ["No target parameter selected"] };
    const previewChange = configTuningEngine.preview(parameter, systemState);
    if (previewChange.previous === previewChange.next) return { systemState, decision, applied: false, reasons: ["Auto-repair did not produce a meaningful change"] };
    const simulation = simulateHealingImpact({ parameter, previous: previewChange.previous, next: previewChange.next, config: configBefore, systemState });
    const safety = evaluateSelfHealingSafety({ decision, systemState, loopAllowed: loop.allowed, simulationSafe: simulation.safe });
    if (!safety.allowed) {
      healingLoopController.record(false);
      healingAuditLogger.log({ action: decision.action, reason: safety.reasons.join("; "), expectedImpact: "Unsafe change blocked", realResult: "No change applied", systemState: systemState.state });
      return { systemState, decision, applied: false, reasons: [...loop.reasons, ...safety.reasons] };
    }
    const change = autoRepairEngine.apply(decision, systemState);
    if (change) {
      change.simulatedImpact = simulation;
      intelligentRollbackEngine.capture(change, configBefore, systemState);
      socBehaviorLearningEngine.recordThresholdOutcome(change.parameter, systemState.score);
    }
    healingLoopController.record(Boolean(change));
    healingAuditLogger.log({ action: decision.action, reason: decision.reason, expectedImpact: simulation.reasons.join("; "), realResult: change ? "Internal configuration tuned" : "No change applied", change, systemState: systemState.state });
    return { systemState, decision, applied: Boolean(change), change, reasons: [decision.reason, ...simulation.reasons] };
  }

  status() {
    return {
      systemState: systemStateMonitor.snapshot(),
      lastHealingActions: healingAuditLogger.list(20),
      rollbackHistory: intelligentRollbackEngine.history(),
      tuningChanges: configTuningEngine.changes(),
      recoveryMode: recoveryModeEngine.status(),
      loop: healingLoopController.status(),
      learning: socBehaviorLearningEngine.summary(),
      config: configTuningEngine.current(),
    };
  }
}

export const socSelfHealingEngine = new SOCSelfHealingEngine();
