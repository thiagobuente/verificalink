import type { SOCOperatorPriority } from "./types";

export interface HiddenRiskInput {
  correlationScore?: number;
  providerCount?: number;
  conflictingSignals?: number;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateHiddenRisk(input: HiddenRiskInput): number {
  const correlationScore = input.correlationScore ?? 0;
  const providerCount = input.providerCount ?? 0;
  const conflictingSignals = input.conflictingSignals ?? 0;
  const providerBoost = providerCount > 1 ? 10 : 0;
  const conflictPenalty = conflictingSignals * 8;
  return clampScore(correlationScore + providerBoost - conflictPenalty);
}

export function adjustPriority(score: number): SOCOperatorPriority {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}
