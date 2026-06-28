export interface SOCHealthScoreInput {
  latencyMs?: number;
  failureRate?: number;
  driftStable?: boolean;
  automationSafe?: boolean;
  incidentAccuracy?: number;
}

export function calculateSOCHealthScore(input: SOCHealthScoreInput): number {
  let score = 100;
  score -= Math.min(30, Math.round((input.latencyMs ?? 0) / 500));
  score -= Math.min(30, input.failureRate ?? 0);
  if (input.driftStable === false) score -= 20;
  if (input.automationSafe === false) score -= 20;
  score += Math.min(10, Math.max(0, (input.incidentAccuracy ?? 80) - 80));
  return Math.max(0, Math.min(100, score));
}
