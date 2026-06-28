const metrics = {
  executionLatencyMs: [] as number[],
  failures: 0,
  executions: 0,
  cloudSyncDelayMs: [] as number[],
  approvalDelayMs: [] as number[],
  rollbackFrequency: 0,
};

function push(values: number[], value: number): void {
  if (Number.isFinite(value)) values.push(Math.max(0, Math.round(value)));
  if (values.length > 500) values.shift();
}

function avg(values: number[]): number {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export function recordRemediationExecutionLatency(ms: number): void {
  metrics.executions += 1;
  push(metrics.executionLatencyMs, ms);
}

export function recordRemediationFailure(): void {
  metrics.failures += 1;
}

export function recordCloudSyncDelay(ms: number): void {
  push(metrics.cloudSyncDelayMs, ms);
}

export function recordApprovalDelay(ms: number): void {
  push(metrics.approvalDelayMs, ms);
}

export function recordRollback(): void {
  metrics.rollbackFrequency += 1;
}

export function getRemediationMetrics() {
  return {
    executionLatencyAvgMs: avg(metrics.executionLatencyMs),
    failureRate: metrics.executions ? metrics.failures / metrics.executions : 0,
    cloudSyncDelayAvgMs: avg(metrics.cloudSyncDelayMs),
    approvalDelayAvgMs: avg(metrics.approvalDelayMs),
    rollbackFrequency: metrics.rollbackFrequency,
    executions: metrics.executions,
    failures: metrics.failures,
  };
}
