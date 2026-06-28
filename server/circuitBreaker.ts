/**
 * Circuit Breaker Module
 * Implementa padrão de Circuit Breaker para resiliência e falha rápida
 */

// ============================================================================
// 1. CIRCUIT BREAKER STATES
// ============================================================================

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Número de falhas para abrir o circuito
  successThreshold: number;      // Número de sucessos para fechar o circuito
  timeout: number;               // Tempo em ms antes de tentar half-open
  resetTimeout: number;          // Tempo em ms para resetar contadores
  monitoringPeriod: number;      // Período de monitoramento em ms
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  averageResponseTime: number;
}

// ============================================================================
// 2. CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private rejectionCount = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private openedAt?: number;
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rejectedRequests: 0,
    averageResponseTime: 0,
  };
  private responseTimes: number[] = [];
  private readonly name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,           // 1 minuto
      resetTimeout: 300000,     // 5 minutos
      monitoringPeriod: 60000,  // 1 minuto
      ...config,
    };

    // Resetar contadores periodicamente
    setInterval(() => this.resetMetrics(), this.config.monitoringPeriod);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        this.rejectionCount++;
        this.metrics.rejectedRequests++;
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    this.metrics.totalRequests++;
    const startTime = Date.now();

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    this.lastSuccessTime = Date.now();
    this.metrics.successfulRequests++;

    if (this.state === 'half-open' && this.successCount >= this.config.successThreshold) {
      this.state = 'closed';
      this.successCount = 0;
      console.log(`✅ Circuit breaker ${this.name} is CLOSED`);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.metrics.failedRequests++;

    if (this.failureCount >= this.config.failureThreshold && this.state !== 'open') {
      this.state = 'open';
      this.openedAt = Date.now();
      console.log(`🔴 Circuit breaker ${this.name} is OPEN`);
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return false;
    return Date.now() - this.openedAt >= this.config.timeout;
  }

  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }

    const total = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = total / this.responseTimes.length;
  }

  private resetMetrics(): void {
    // Manter histórico mas resetar contadores
    this.failureCount = Math.max(0, this.failureCount - 1);
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.rejectionCount = 0;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      averageResponseTime: 0,
    };
    this.responseTimes = [];
    console.log(`🔄 Circuit breaker ${this.name} has been reset`);
  }

  getStatus(): {
    name: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    metrics: CircuitBreakerMetrics;
  } {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      metrics: this.getMetrics(),
    };
  }
}

// ============================================================================
// 3. RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;      // ms
  maxDelay: number;           // ms
  backoffMultiplier: number;
  jitter: boolean;
}

export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      ...config,
    };
  }

  async execute<T>(
    fn: () => Promise<T>,
    shouldRetry: (error: any) => boolean = () => true
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this.config.maxRetries || !shouldRetry(error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);
    delay = Math.min(delay, this.config.maxDelay);

    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// 4. BULKHEAD PATTERN
// ============================================================================

export class Bulkhead {
  private activeRequests = 0;
  private waitingQueue: Array<() => void> = [];
  private readonly maxConcurrent: number;
  private readonly name: string;

  constructor(name: string, maxConcurrent: number = 10) {
    this.name = name;
    this.maxConcurrent = maxConcurrent;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrent) {
      await new Promise<void>((resolve) => { this.waitingQueue.push(resolve); });
    }

    this.activeRequests++;

    try {
      return await fn();
    } finally {
      this.activeRequests--;

      const next = this.waitingQueue.shift();
      if (next) {
        next();
      }
    }
  }

  getStatus(): {
    name: string;
    activeRequests: number;
    waitingRequests: number;
    maxConcurrent: number;
  } {
    return {
      name: this.name,
      activeRequests: this.activeRequests,
      waitingRequests: this.waitingQueue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// ============================================================================
// 5. TIMEOUT HANDLER
// ============================================================================

export class TimeoutHandler {
  static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }
}

// ============================================================================
// 6. RESILIENCE MANAGER
// ============================================================================

export class ResilienceManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private bulkheads: Map<string, Bulkhead> = new Map();
  private retryHandler: RetryHandler;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryHandler = new RetryHandler(retryConfig);
  }

  registerCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    const cb = new CircuitBreaker(name, config);
    this.circuitBreakers.set(name, cb);
    return cb;
  }

  registerBulkhead(name: string, maxConcurrent?: number): Bulkhead {
    const bh = new Bulkhead(name, maxConcurrent);
    this.bulkheads.set(name, bh);
    return bh;
  }

  async executeWithResilience<T>(
    name: string,
    fn: () => Promise<T>,
    options: {
      circuitBreaker?: boolean;
      bulkhead?: boolean;
      retry?: boolean;
      timeout?: number;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      circuitBreaker = true,
      bulkhead = true,
      retry = true,
      timeout = 30000,
      shouldRetry = (error: any) => error.code !== 'INVALID_INPUT',
    } = options;

    let fn_ = fn;

    // Aplicar timeout
    if (timeout) {
      fn_ = () => TimeoutHandler.executeWithTimeout(fn, timeout);
    }

    // Aplicar retry
    if (retry) {
      fn_ = () => this.retryHandler.execute(fn_, shouldRetry);
    }

    // Aplicar bulkhead
    if (bulkhead) {
      const bh = this.bulkheads.get(name) || this.registerBulkhead(name);
      fn_ = () => bh.execute(fn_);
    }

    // Aplicar circuit breaker
    if (circuitBreaker) {
      const cb = this.circuitBreakers.get(name) || this.registerCircuitBreaker(name);
      return cb.execute(fn_);
    }

    return fn_();
  }

  getStatus(): {
    circuitBreakers: any[];
    bulkheads: any[];
  } {
    return {
      circuitBreakers: Array.from(this.circuitBreakers.values()).map(cb => cb.getStatus()),
      bulkheads: Array.from(this.bulkheads.values()).map(bh => bh.getStatus()),
    };
  }

  reset(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.reset();
    }
  }
}
