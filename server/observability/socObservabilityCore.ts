import { socMetricsEngine } from "./socMetricsEngine";
import { socSLAEngine } from "./socSLAEngine";
import { socTraceEngine } from "./socTraceEngine";

export class SOCObservabilityCore {
  recordLatency(tenantId: string, metric: "ioc_response_ms" | "correlation_ms" | "incident_creation_ms" | "command_center_lag_ms" | string, value: number): void {
    socMetricsEngine.observe(metric, value, { tenant: tenantId });
    if (metric === "ioc_response_ms" || metric === "correlation_ms" || metric === "incident_creation_ms" || metric === "command_center_lag_ms") socSLAEngine.evaluate(tenantId, metric, value);
  }

  recordCounter(name: Parameters<typeof socMetricsEngine.increment>[0], labels = {}): void {
    socMetricsEngine.increment(name, labels);
  }

  snapshot() {
    return { metrics: socMetricsEngine.snapshot(), traces: socTraceEngine.list(), slo: socSLAEngine.thresholds() };
  }
}

export const socObservabilityCore = new SOCObservabilityCore();
