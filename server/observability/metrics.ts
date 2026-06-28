import { getSOCMetrics } from "../providers/storage/metrics";

const startedAt = Date.now();
let requestCount = 0;
let errorCount = 0;

export function recordRequest() {
  requestCount += 1;
}

export function recordError() {
  errorCount += 1;
}

export function getMetrics() {
  return {
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    requestCount,
    errorCount,
    soc: getSOCMetrics(),
    timestamp: new Date().toISOString(),
  };
}
