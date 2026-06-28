const actionTimestamps: number[] = [];
let consecutiveFailures = 0;
let cooldownUntil = 0;
let recoveryMode = false;

export interface HealingLoopDecision {
  allowed: boolean;
  recoveryMode: boolean;
  reasons: string[];
}

export class HealingLoopController {
  canRun(): HealingLoopDecision {
    const now = Date.now();
    const reasons: string[] = [];
    if (now < cooldownUntil) reasons.push("Healing cooldown is active");
    const last = actionTimestamps.at(-1) ?? 0;
    if (now - last < 60 * 1000) reasons.push("Maximum one healing action per 60 seconds");
    if (recoveryMode) reasons.push("Recovery mode is active after repeated failures");
    return { allowed: reasons.length === 0, recoveryMode, reasons: reasons.length ? reasons : ["Healing loop may run"] };
  }

  record(success: boolean): void {
    actionTimestamps.push(Date.now());
    if (actionTimestamps.length > 20) actionTimestamps.shift();
    const recent = actionTimestamps.slice(-3);
    if (recent.length === 3) cooldownUntil = Date.now() + 5 * 60 * 1000;
    consecutiveFailures = success ? 0 : consecutiveFailures + 1;
    if (consecutiveFailures >= 2) recoveryMode = true;
  }

  clearRecovery(): void {
    consecutiveFailures = 0;
    recoveryMode = false;
  }

  status() {
    return { actionTimestamps: [...actionTimestamps], consecutiveFailures, cooldownUntil, recoveryMode };
  }
}

export const healingLoopController = new HealingLoopController();
