import type { AutomationLevel } from "./autonomousModels";

export function automationLevelFor(confidence: number): AutomationLevel {
  if (confidence < 50) return "manual_only";
  if (confidence <= 75) return "assisted";
  if (confidence <= 90) return "semi_auto";
  return "auto_safe_only";
}

export function shouldExecute(actionType: string, confidence: number): { allowed: boolean; level: AutomationLevel; reason: string } {
  const level = automationLevelFor(confidence);
  if (/block|block_suggestion/i.test(actionType)) return { allowed: false, level: "manual_only", reason: "Blocking is never executed automatically" };
  if (/monitor|alert/i.test(actionType)) return { allowed: true, level, reason: "Low-risk SOC action" };
  if (/ticket|investigate/i.test(actionType)) return { allowed: false, level: "assisted", reason: "Investigation requires analyst confirmation" };
  if (/rate_limit/i.test(actionType)) return { allowed: confidence > 85, level, reason: confidence > 85 ? "Semi-auto rate-limit suggestion allowed as reversible state" : "Insufficient confidence for semi-auto" };
  return { allowed: false, level, reason: "Unknown action type requires manual review" };
}
