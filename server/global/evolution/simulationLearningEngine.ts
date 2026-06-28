import type { WarGameRun } from "../simulation/simulationModels";

export function recommendedAdjustmentFromSimulation(run: WarGameRun): "missed_detection" | "false_positive" | "ai_priority_error" | undefined {
  if (run.gaps.some((gap) => gap.type === "undetected_attack" || gap.type === "correlation_failure")) return "missed_detection";
  if (run.resilienceScore.falsePositiveResistance < 60) return "false_positive";
  if (run.resilienceScore.detectionRate < 70 && run.resilienceScore.responseEffectiveness >= 70) return "ai_priority_error";
  return undefined;
}
