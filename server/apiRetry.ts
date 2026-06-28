/**
 * API Retry Service
 * Handles automatic retries with exponential backoff for failed API calls
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, config.maxDelayMs);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, config: RetryConfig): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP status codes
  if (error.status && config.retryableStatusCodes.includes(error.status)) {
    return true;
  }

  return false;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  serviceName: string,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...customConfig };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`[RETRY] ${serviceName} - Attempt ${attempt}/${config.maxAttempts}`);
      const result = await fn();
      if (attempt > 1) {
        console.log(`[RETRY] ${serviceName} - Success on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxAttempts) {
        console.error(`[RETRY] ${serviceName} - All attempts failed:`, lastError.message);
        throw lastError;
      }

      if (!isRetryableError(error, config)) {
        console.error(`[RETRY] ${serviceName} - Non-retryable error:`, lastError.message);
        throw lastError;
      }

      const delayMs = calculateBackoffDelay(attempt, config);
      console.warn(
        `[RETRY] ${serviceName} - Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delayMs}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error(`${serviceName} failed after ${config.maxAttempts} attempts`);
}

/**
 * Batch retry with concurrency control
 */
export async function batchRetryWithBackoff<T>(
  fns: Array<() => Promise<T>>,
  serviceName: string,
  concurrency: number = 3,
  customConfig?: Partial<RetryConfig>
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const results: Array<{ success: boolean; result?: T; error?: Error }> = [];
  const queue = [...fns];
  let running = 0;

  return new Promise((resolve, reject) => {
    const processNext = async () => {
      if (queue.length === 0 && running === 0) {
        resolve(results);
        return;
      }

      if (queue.length === 0 || running >= concurrency) {
        return;
      }

      running++;
      const fn = queue.shift();

      if (!fn) {
        running--;
        processNext();
        return;
      }

      try {
        const result = await retryWithBackoff(fn, `${serviceName}[${results.length}]`, customConfig);
        results.push({ success: true, result });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      running--;
      processNext();
    };

    // Start initial batch
    for (let i = 0; i < Math.min(concurrency, fns.length); i++) {
      processNext();
    }
  });
}

/**
 * Get retry statistics
 */
export interface RetryStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageAttemptsPerRequest: number;
  successRate: number;
}

export class RetryTracker {
  private stats = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    requestCount: 0,
  };

  recordAttempt(success: boolean, attempts: number) {
    this.stats.totalAttempts += attempts;
    this.stats.requestCount++;
    if (success) {
      this.stats.successfulAttempts++;
    } else {
      this.stats.failedAttempts++;
    }
  }

  getStats(): RetryStats {
    return {
      totalAttempts: this.stats.totalAttempts,
      successfulAttempts: this.stats.successfulAttempts,
      failedAttempts: this.stats.failedAttempts,
      averageAttemptsPerRequest:
        this.stats.requestCount > 0
          ? this.stats.totalAttempts / this.stats.requestCount
          : 0,
      successRate:
        this.stats.requestCount > 0
          ? (this.stats.successfulAttempts / this.stats.requestCount) * 100
          : 0,
    };
  }

  reset() {
    this.stats = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      requestCount: 0,
    };
  }
}

export const retryTracker = new RetryTracker();
