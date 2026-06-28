import { registerAlert } from "./alertFatigueController";

export interface SOCSLOViolation {
  tenantId: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

const thresholds: Record<string, number> = {
  ioc_response_ms: 2000,
  correlation_ms: 1500,
  incident_creation_ms: 1000,
  command_center_lag_ms: 3000,
};

export class SOCSLAEngine {
  evaluate(tenantId: string, metric: keyof typeof thresholds, value: number): SOCSLOViolation | undefined {
    const threshold = thresholds[metric];
    if (value <= threshold) return undefined;
    const violation = { tenantId, metric, value, threshold, timestamp: Date.now() };
    registerAlert({ tenantId, signature: "slo:" + metric, severity: "high", message: metric + " exceeded SLO" });
    return violation;
  }

  thresholds() {
    return { ...thresholds };
  }
}

export const socSLAEngine = new SOCSLAEngine();
