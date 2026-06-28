export async function executeWithTimeoutRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: { timeoutMs: number; retries: number; retryBaseDelayMs: number },
): Promise<{ value: T; latency: number }> {
  const started = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const value = await operation(controller.signal);
      clearTimeout(timeout);
      return { value, latency: Date.now() - started };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt >= options.retries) break;
      const delay = options.retryBaseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
