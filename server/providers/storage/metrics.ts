export interface TenantSOCMetrics {
  tenantId: string;
  incidentVolume: number;
  iocIngestionRate: number;
  correlationSuccessRate: number;
  apiUsage: number;
  aiOperatorAdjustments: number;
}

export interface SOCMetricsSnapshot {
  incidentThroughput: number;
  correlationLatencyMs: number[];
  providerFailureRate: number;
  aiOperatorAdjustments: number;
  actionDistribution: Record<string, number>;
  replayRequests: number;
  storageFailures: number;
  tenants: Record<string, TenantSOCMetrics>;
}

const metrics: SOCMetricsSnapshot = {
  incidentThroughput: 0,
  correlationLatencyMs: [],
  providerFailureRate: 0,
  aiOperatorAdjustments: 0,
  actionDistribution: {},
  replayRequests: 0,
  storageFailures: 0,
  tenants: {},
};

function tenantMetrics(tenantId: string): TenantSOCMetrics {
  metrics.tenants[tenantId] ??= { tenantId, incidentVolume: 0, iocIngestionRate: 0, correlationSuccessRate: 0, apiUsage: 0, aiOperatorAdjustments: 0 };
  return metrics.tenants[tenantId];
}

export function recordIncidentStored(tenantId = "unknown"): void {
  metrics.incidentThroughput += 1;
  const tenant = tenantMetrics(tenantId);
  tenant.incidentVolume += 1;
  tenant.iocIngestionRate += 1;
}

export function recordCorrelationLatency(ms: number): void {
  if (Number.isFinite(ms)) metrics.correlationLatencyMs.push(Math.max(0, Math.round(ms)));
  if (metrics.correlationLatencyMs.length > 200) metrics.correlationLatencyMs.shift();
}

export function recordProviderFailureRate(failures: number, total: number): void {
  metrics.providerFailureRate = total > 0 ? Math.round((failures / total) * 100) : 0;
}

export function recordTenantCorrelation(tenantId: string, success: boolean): void {
  const tenant = tenantMetrics(tenantId);
  tenant.correlationSuccessRate = success ? Math.min(100, tenant.correlationSuccessRate + 1) : tenant.correlationSuccessRate;
}

export function recordTenantApiUsage(tenantId: string): void {
  tenantMetrics(tenantId).apiUsage += 1;
}

export function recordAIOperatorAdjustment(tenantId = "unknown", adjusted: boolean): void {
  if (adjusted) {
    metrics.aiOperatorAdjustments += 1;
    tenantMetrics(tenantId).aiOperatorAdjustments += 1;
  }
}

export function recordActionDistribution(tenantId = "unknown", actions?: Array<{ actionType?: string }>): void {
  for (const action of actions ?? []) {
    const key = tenantId + ":" + (action.actionType ?? "unknown");
    metrics.actionDistribution[key] = (metrics.actionDistribution[key] ?? 0) + 1;
  }
}

export function recordReplayRequest(): void {
  metrics.replayRequests += 1;
}

export function recordStorageFailure(): void {
  metrics.storageFailures += 1;
}

export function getSOCMetrics(): SOCMetricsSnapshot & { averageCorrelationLatencyMs: number } {
  const totalLatency = metrics.correlationLatencyMs.reduce((sum, value) => sum + value, 0);
  return {
    ...metrics,
    averageCorrelationLatencyMs: metrics.correlationLatencyMs.length > 0 ? Math.round(totalLatency / metrics.correlationLatencyMs.length) : 0,
  };
}
