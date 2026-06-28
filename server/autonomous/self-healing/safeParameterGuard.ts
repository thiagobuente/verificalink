import type { HealingConfigState, TunableParameter } from "./selfHealingTypes";

const bounds: Record<TunableParameter, { min: number; max: number }> = {
  providerTimeoutMs: { min: 200, max: 10000 },
  retryCount: { min: 0, max: 5 },
  cacheTtlMs: { min: 10000, max: 900000 },
  correlationThreshold: { min: 10, max: 95 },
  alertSensitivity: { min: 0.1, max: 1 },
  driftSensitivity: { min: 0.1, max: 1 },
};

export interface ParameterGuardResult {
  safe: boolean;
  value: number;
  reasons: string[];
}

export function guardParameter(parameter: TunableParameter, value: number): ParameterGuardResult {
  const limit = bounds[parameter];
  if (!Number.isFinite(value)) return { safe: false, value: limit.min, reasons: ["Parameter value is not finite"] };
  const bounded = Math.max(limit.min, Math.min(limit.max, value));
  return { safe: bounded === value, value: bounded, reasons: bounded === value ? ["Parameter is within safe bounds"] : [parameter + " clamped to safe bounds"] };
}

export function guardConfig(config: HealingConfigState): HealingConfigState {
  return {
    ...config,
    providerTimeoutMs: guardParameter("providerTimeoutMs", config.providerTimeoutMs).value,
    retryCount: Math.round(guardParameter("retryCount", config.retryCount).value),
    cacheTtlMs: guardParameter("cacheTtlMs", config.cacheTtlMs).value,
    correlationThreshold: guardParameter("correlationThreshold", config.correlationThreshold).value,
    alertSensitivity: guardParameter("alertSensitivity", config.alertSensitivity).value,
    driftSensitivity: guardParameter("driftSensitivity", config.driftSensitivity).value,
  };
}

export function getParameterBounds() {
  return { ...bounds };
}
