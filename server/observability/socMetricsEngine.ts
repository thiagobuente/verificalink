export type SOCMetricLabels = { tenant?: string; provider?: string; severity?: string };

export interface SOCMetricPoint {
  name: string;
  value: number;
  labels: SOCMetricLabels;
  timestamp: number;
}

const counters = new Map<string, SOCMetricPoint>();
const histograms = new Map<string, SOCMetricPoint[]>();

function key(name: string, labels: SOCMetricLabels): string {
  return name + ":" + JSON.stringify(labels);
}

export class SOCMetricsEngine {
  increment(name: "ioc_requests_total" | "provider_failures_total" | "incident_creation_rate" | "automation_execution_rate" | "drift_events_total", labels: SOCMetricLabels = {}, value = 1): void {
    const metricKey = key(name, labels);
    const existing = counters.get(metricKey);
    counters.set(metricKey, { name, labels, value: (existing?.value ?? 0) + value, timestamp: Date.now() });
  }

  observe(name: "correlation_score_avg" | string, value: number, labels: SOCMetricLabels = {}): void {
    const metricKey = key(name, labels);
    const values = histograms.get(metricKey) ?? [];
    values.push({ name, labels, value, timestamp: Date.now() });
    if (values.length > 500) values.shift();
    histograms.set(metricKey, values);
  }

  snapshot() {
    return {
      counters: [...counters.values()],
      histograms: [...histograms.entries()].map(([metricKey, values]) => ({ metricKey, count: values.length, avg: values.length ? Math.round(values.reduce((sum, point) => sum + point.value, 0) / values.length) : 0, latest: values.at(-1) })),
    };
  }
}

export const socMetricsEngine = new SOCMetricsEngine();
