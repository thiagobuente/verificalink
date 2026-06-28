export interface EnterpriseMetricsSnapshot {
  externalIngestionRate: Record<string, number>;
  siemSyncLatency: Record<string, number[]>;
  connectorFailures: Record<string, number>;
  exportUsagePerTenant: Record<string, number>;
}

const metrics: EnterpriseMetricsSnapshot = {
  externalIngestionRate: {},
  siemSyncLatency: {},
  connectorFailures: {},
  exportUsagePerTenant: {},
};

export function recordExternalIngestion(tenantId: string): void {
  metrics.externalIngestionRate[tenantId] = (metrics.externalIngestionRate[tenantId] ?? 0) + 1;
}

export function recordSiemSyncLatency(connectorId: string, latencyMs: number): void {
  metrics.siemSyncLatency[connectorId] ??= [];
  metrics.siemSyncLatency[connectorId].push(Math.max(0, Math.round(latencyMs)));
  if (metrics.siemSyncLatency[connectorId].length > 200) metrics.siemSyncLatency[connectorId].shift();
}

export function recordConnectorFailure(connectorId: string): void {
  metrics.connectorFailures[connectorId] = (metrics.connectorFailures[connectorId] ?? 0) + 1;
}

export function recordExportUsage(tenantId: string): void {
  metrics.exportUsagePerTenant[tenantId] = (metrics.exportUsagePerTenant[tenantId] ?? 0) + 1;
}

export function getEnterpriseMetrics(): EnterpriseMetricsSnapshot & { averageSiemSyncLatency: Record<string, number> } {
  const averageSiemSyncLatency = Object.fromEntries(Object.entries(metrics.siemSyncLatency).map(([connectorId, values]) => [
    connectorId,
    values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
  ]));
  return { ...metrics, averageSiemSyncLatency };
}
