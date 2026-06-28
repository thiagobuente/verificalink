const requestBuckets = new Map<string, number[]>();

function withinRate(key: string, maxPerSecond: number): boolean {
  const now = Date.now();
  const bucket = (requestBuckets.get(key) ?? []).filter((timestamp) => now - timestamp < 1000);
  bucket.push(now);
  requestBuckets.set(key, bucket);
  return bucket.length <= maxPerSecond;
}

export function validatePerformance(input: { responseTimeMs?: number; providerCalls?: number; correlationItems?: number; requestKey?: string }) {
  const errors: string[] = [];
  if ((input.responseTimeMs ?? 0) > 10000) errors.push("response time threshold exceeded");
  if ((input.providerCalls ?? 0) > 10) errors.push("provider parallelism threshold exceeded");
  if ((input.correlationItems ?? 0) > 1000) errors.push("correlation complexity threshold exceeded");
  if (!withinRate(input.requestKey ?? "global-ioc", 50)) errors.push("IOC requests per second threshold exceeded");
  return { valid: errors.length === 0, errors, batching: "batch correlation execution required above threshold" };
}
