/**
 * API Monitoring Service
 * In-memory release-safe monitoring fallback.
 */

export interface APILogEntry {
  service: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  error?: string;
  success: boolean;
  timestamp: Date;
  userId?: string;
}

export interface APIMetrics {
  service: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  lastError?: string;
  lastErrorTime?: Date;
}

const logs: APILogEntry[] = [];

export async function logAPICall(entry: APILogEntry): Promise<void> {
  logs.push(entry);
  if (logs.length > 5000) logs.shift();
}

export async function getAPIMetrics(service: string, hoursBack = 24): Promise<APIMetrics> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const serviceLogs = logs.filter((log) => log.service === service && log.timestamp >= since);
  const successfulRequests = serviceLogs.filter((log) => log.success).length;
  const failedRequests = serviceLogs.length - successfulRequests;
  const responseTimes = serviceLogs.map((log) => log.responseTime).filter((value) => value > 0);
  const lastError = serviceLogs.filter((log) => log.error).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  return {
    service,
    totalRequests: serviceLogs.length,
    successfulRequests,
    failedRequests,
    averageResponseTime: responseTimes.length ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length : 0,
    minResponseTime: responseTimes.length ? Math.min(...responseTimes) : 0,
    maxResponseTime: responseTimes.length ? Math.max(...responseTimes) : 0,
    errorRate: serviceLogs.length ? (failedRequests / serviceLogs.length) * 100 : 0,
    lastError: lastError?.error,
    lastErrorTime: lastError?.timestamp,
  };
}

export async function getServicesHealthStatus(): Promise<Record<string, APIMetrics>> {
  const services = ['virustotal', 'urlhaus', 'safebrowsing', 'whois'];
  const status: Record<string, APIMetrics> = {};
  for (const service of services) status[service] = await getAPIMetrics(service);
  return status;
}

export async function getErrorSummary(hoursBack = 24): Promise<Array<{ service: string; errorCount: number; errorRate: number; topErrors: Array<{ error: string; count: number }> }>> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const failed = logs.filter((log) => !log.success && log.timestamp >= since);
  const services = [...new Set(failed.map((log) => log.service))];
  return services.map((service) => {
    const serviceLogs = failed.filter((log) => log.service === service);
    const counts: Record<string, number> = {};
    for (const log of serviceLogs) counts[log.error ?? 'Unknown error'] = (counts[log.error ?? 'Unknown error'] ?? 0) + 1;
    return {
      service,
      errorCount: serviceLogs.length,
      errorRate: failed.length ? (serviceLogs.length / failed.length) * 100 : 0,
      topErrors: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([error, count]) => ({ error, count })),
    };
  });
}

export async function cleanupOldLogs(daysOld = 30): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const before = logs.length;
  for (let index = logs.length - 1; index >= 0; index -= 1) {
    if (logs[index].timestamp < cutoff) logs.splice(index, 1);
  }
  return before - logs.length;
}
