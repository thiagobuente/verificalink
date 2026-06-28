export type SOCSystemState = "healthy" | "degraded" | "unstable" | "critical";
export type HealingActionType = "tune" | "rollback" | "no_action" | "recovery_mode";
export type TunableParameter = "providerTimeoutMs" | "retryCount" | "cacheTtlMs" | "correlationThreshold" | "alertSensitivity" | "driftSensitivity";

export interface SystemStateSnapshot {
  state: SOCSystemState;
  score: number;
  reasons: string[];
  metrics: {
    pipelineLatencyMs: number;
    providerFailureRate: number;
    driftInstability: number;
    commandCenterDegraded: boolean;
    automationErrors: number;
  };
  timestamp: number;
}

export interface HealingConfigState {
  providerTimeoutMs: number;
  retryCount: number;
  cacheTtlMs: number;
  correlationThreshold: number;
  alertSensitivity: number;
  driftSensitivity: number;
  autoTuningEnabled: boolean;
  fallbackLevel: "normal" | "high" | "maximum";
  pipelineComplexity: "full" | "reduced";
}

export interface HealingChange {
  id: string;
  parameter: TunableParameter;
  previous: number;
  next: number;
  reason: string;
  timestamp: number;
  simulatedImpact?: HealingImpactSimulation;
}

export interface HealingImpactSimulation {
  latencyImpact: number;
  falsePositiveImpact: number;
  risk: "low" | "medium" | "high";
  safe: boolean;
  reasons: string[];
}

export interface HealingDecision {
  action: HealingActionType;
  confidence: number;
  reason: string;
  targetParameter?: TunableParameter;
}

export interface HealingAuditEvent {
  id: string;
  timestamp: number;
  action: HealingActionType;
  reason: string;
  expectedImpact: string;
  realResult?: string;
  change?: HealingChange;
  systemState: SOCSystemState;
}

export const defaultHealingConfig: HealingConfigState = {
  providerTimeoutMs: 3000,
  retryCount: 2,
  cacheTtlMs: 120000,
  correlationThreshold: 50,
  alertSensitivity: 0.6,
  driftSensitivity: 0.5,
  autoTuningEnabled: true,
  fallbackLevel: "normal",
  pipelineComplexity: "full",
};
