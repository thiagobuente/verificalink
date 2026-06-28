import type { SOCEvolutionAdjustment, SOCEvolutionState } from "./evolutionModels";

export const defaultEvolutionState: SOCEvolutionState = {
  scoringWeights: { providerConsensus: 1, malwareSignal: 1, exposureSignal: 1 },
  correlationThresholds: { incident: 70, campaign: 75, global: 70 },
  alertSensitivity: 0.5,
  aiOperatorBias: 0,
  lastUpdated: Date.now(),
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(value.toFixed(3))));
}

export function applySingleAdjustment(state: SOCEvolutionState, reason: string, kind: "missed_detection" | "false_positive" | "ai_priority_error"): { state: SOCEvolutionState; adjustment: SOCEvolutionAdjustment } {
  const next = { ...state, scoringWeights: { ...state.scoringWeights }, correlationThresholds: { ...state.correlationThresholds }, lastUpdated: Date.now() };
  let adjustment: SOCEvolutionAdjustment;
  if (kind === "missed_detection") {
    const previous = next.correlationThresholds.incident;
    next.correlationThresholds.incident = clamp(previous - 2, 45, 90);
    adjustment = { field: "correlationThresholds.incident", previous, next: next.correlationThresholds.incident, reason, timestamp: next.lastUpdated };
  } else if (kind === "false_positive") {
    const previous = next.alertSensitivity;
    next.alertSensitivity = clamp(previous - 0.05, 0.1, 1);
    adjustment = { field: "alertSensitivity", previous, next: next.alertSensitivity, reason, timestamp: next.lastUpdated };
  } else {
    const previous = next.aiOperatorBias;
    next.aiOperatorBias = clamp(previous + 0.03, -0.3, 0.3);
    adjustment = { field: "aiOperatorBias", previous, next: next.aiOperatorBias, reason, timestamp: next.lastUpdated };
  }
  return { state: next, adjustment };
}
