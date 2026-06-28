export interface SOCEvolutionState {
  scoringWeights: Record<string, number>;
  correlationThresholds: Record<string, number>;
  alertSensitivity: number;
  aiOperatorBias: number;
  lastUpdated: number;
}

export interface SOCVersionedConfig {
  version: string;
  state: SOCEvolutionState;
  timestamp: number;
  stable: boolean;
}

export interface SOCEvolutionAdjustment {
  field: string;
  previous: number;
  next: number;
  reason: string;
  timestamp: number;
}

export type SOCDriftMode = "stable" | "unstable" | "recovery_mode";

export interface SOCDriftStatus {
  driftDetected: boolean;
  driftScore: number;
  reasons: string[];
  mode: SOCDriftMode;
  autoAdjustBlocked: boolean;
}

export interface SOCEvolutionMetrics {
  detectionImprovementRate: number;
  falsePositiveReduction: number;
  simulationSuccessRate: number;
  stabilityScore: number;
}
