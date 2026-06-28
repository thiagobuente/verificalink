import type { HealingDecision, SystemStateSnapshot } from "./selfHealingTypes";

export interface SelfHealingSafetyDecision {
  allowed: boolean;
  reasons: string[];
}

const forbiddenActionTerms = [/block/i, /firewall/i, /shell/i, /external/i, /incident data/i, /security rule/i];

export function evaluateSelfHealingSafety(input: { decision: HealingDecision; systemState: SystemStateSnapshot; loopAllowed: boolean; simulationSafe: boolean }): SelfHealingSafetyDecision {
  const reasons: string[] = [];
  if (!input.loopAllowed) reasons.push("Healing loop controller blocked repeated action");
  if (!input.simulationSafe) reasons.push("Impact simulation marked change as unsafe");
  if (input.decision.action === "no_action") reasons.push("No healing action requested");
  if (forbiddenActionTerms.some((pattern) => pattern.test(input.decision.reason))) reasons.push("Decision reason references forbidden external or security actions");
  if (input.decision.action === "tune" && !input.decision.targetParameter) reasons.push("Tune action requires a target parameter");
  return { allowed: reasons.length === 0, reasons: reasons.length ? reasons : ["Self-healing safety rules passed"] };
}

export function selfHealingSafetyPolicy() {
  return {
    rules: [
      "never alter SOC security rules",
      "never block pipelines",
      "never execute external actions",
      "never run healing in an infinite loop",
      "maximum impact is internal configuration tuning",
    ],
  };
}
