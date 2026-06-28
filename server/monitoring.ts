/**
 * Monitoring & Observability Module
 * Prometheus metrics, OpenTelemetry tracing, e logging estruturado
 */

// ============================================================================
// 1. PROMETHEUS METRICS
// ============================================================================

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  value: number;
  labels?: Record<string, string>;
}

export class PrometheusMetrics {
  private metrics: Map<string, Metric> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  registerCounter(name: string, help: string): void {
    this.metrics.set(name, {
      name,
      type: 'counter',
      help,
      value: 0,
    });
    this.counters.set(name, 0);
  }

  registerGauge(name: string, help: string): void {
    this.metrics.set(name, {
      name,
      type: 'gauge',
      help,
      value: 0,
    });
    this.gauges.set(name, 0);
  }

  registerHistogram(name: string, help: string): void {
    this.metrics.set(name, {
      name,
      type: 'histogram',
      help,
      value: 0,
    });
    this.histograms.set(name, []);
  }

  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  recordHistogram(name: string, value: number): void {
    const histogram = this.histograms.get(name) || [];
    histogram.push(value);
    this.histograms.set(name, histogram);
  }

  getMetrics(): string {
    let output = '';

    // Counters
    for (const [name, value] of this.counters.entries()) {
      output += `# TYPE ${name} counter\n`;
      output += `${name} ${value}\n\n`;
    }

    // Gauges
    for (const [name, value] of this.gauges.entries()) {
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${value}\n\n`;
    }

    // Histograms
    for (const [name, values] of this.histograms.entries()) {
      output += `# TYPE ${name} histogram\n`;
      output += `${name}_bucket{le="+Inf"} ${values.length}\n`;
      output += `${name}_sum ${values.reduce((a, b) => a + b, 0)}\n`;
      output += `${name}_count ${values.length}\n\n`;
    }

    return output;
  }

  getMetricsJSON(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
          },
        ])
      ),
    };
  }
}

// ============================================================================
// 2. DISTRIBUTED TRACING
// ============================================================================

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'ok' | 'error';
  attributes: Record<string, any>;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

export class TracingManager {
  private spans: Map<string, Span> = new Map();
  private activeSpans: Map<string, string> = new Map(); // contextId -> spanId

  startSpan(name: string, contextId: string, parentSpanId?: string): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const span: Span = {
      traceId,
      spanId,
      parentSpanId,
      name,
      startTime: Date.now(),
      status: 'ok',
      attributes: {},
      events: [],
    };

    this.spans.set(spanId, span);
    this.activeSpans.set(contextId, spanId);

    return spanId;
  }

  endSpan(spanId: string, status: 'ok' | 'error' = 'ok'): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
  }

  addEvent(spanId: string, eventName: string, attributes?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes,
    });
  }

  setAttribute(spanId: string, key: string, value: any): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.attributes[key] = value;
  }

  getSpan(spanId: string): Span | null {
    return this.spans.get(spanId) || null;
  }

  getTrace(traceId: string): Span[] {
    return Array.from(this.spans.values()).filter(s => s.traceId === traceId);
  }

  getAllSpans(): Span[] {
    return Array.from(this.spans.values());
  }

  exportTraces(): string {
    const traces: Record<string, Span[]> = {};

    for (const span of this.spans.values()) {
      if (!traces[span.traceId]) {
        traces[span.traceId] = [];
      }
      traces[span.traceId].push(span);
    }

    return JSON.stringify(traces, null, 2);
  }
}

// ============================================================================
// 3. STRUCTURED LOGGING
// ============================================================================

export interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  error?: {
    message: string;
    stack?: string;
  };
}

export class StructuredLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, any>,
    error?: Error,
    traceId?: string,
    spanId?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      traceId,
      spanId,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    this.logs.push(entry);

    // Manter apenas últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log para console em desenvolvimento
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }

  debug(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    this.log('debug', message, context, undefined, traceId, spanId);
  }

  info(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    this.log('info', message, context, undefined, traceId, spanId);
  }

  warn(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    this.log('warn', message, context, undefined, traceId, spanId);
  }

  error(message: string, error?: Error, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    this.log('error', message, context, error, traceId, spanId);
  }

  getLogs(filter?: { level?: string; limit?: number }): LogEntry[] {
    let logs = this.logs;

    if (filter?.level) {
      logs = logs.filter(l => l.level === filter.level);
    }

    const limit = filter?.limit || 100;
    return logs.slice(-limit);
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// ============================================================================
// 4. HEALTH CHECK
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  checks: Record<string, {
    status: 'ok' | 'warning' | 'error';
    message: string;
    responseTime: number;
  }>;
}

export class HealthChecker {
  private startTime = Date.now();
  private checks: Map<string, () => Promise<{ status: string; message: string }>> = new Map();

  registerCheck(name: string, check: () => Promise<{ status: string; message: string }>): void {
    this.checks.set(name, check);
  }

  async getHealth(): Promise<HealthStatus> {
    const checkResults: Record<string, any> = {};
    let hasError = false;
    let hasWarning = false;

    for (const [name, check] of this.checks.entries()) {
      const startTime = Date.now();
      try {
        const result = await check();
        const responseTime = Date.now() - startTime;

        checkResults[name] = {
          status: result.status === 'ok' ? 'ok' : 'warning',
          message: result.message,
          responseTime,
        };

        if (result.status !== 'ok') {
          hasWarning = true;
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        checkResults[name] = {
          status: 'error',
          message: String(error),
          responseTime,
        };
        hasError = true;
      }
    }

    const status = hasError ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy';

    return {
      status,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      checks: checkResults,
    };
  }
}

// ============================================================================
// 5. PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  requestSize?: number;
  responseSize?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 10000;

  recordRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    requestSize?: number,
    responseSize?: number
  ): void {
    this.metrics.push({
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: Date.now(),
      requestSize,
      responseSize,
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAverageResponseTime(endpoint?: string): number {
    let metrics = this.metrics;

    if (endpoint) {
      metrics = metrics.filter(m => m.endpoint === endpoint);
    }

    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    return total / metrics.length;
  }

  getP95ResponseTime(endpoint?: string): number {
    let metrics = this.metrics;

    if (endpoint) {
      metrics = metrics.filter(m => m.endpoint === endpoint);
    }

    if (metrics.length === 0) return 0;

    const sorted = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  getErrorRate(endpoint?: string): number {
    let metrics = this.metrics;

    if (endpoint) {
      metrics = metrics.filter(m => m.endpoint === endpoint);
    }

    if (metrics.length === 0) return 0;

    const errors = metrics.filter(m => m.statusCode >= 400).length;
    return (errors / metrics.length) * 100;
  }

  getMetrics(endpoint?: string, limit: number = 100): PerformanceMetric[] {
    let metrics = this.metrics;

    if (endpoint) {
      metrics = metrics.filter(m => m.endpoint === endpoint);
    }

    return metrics.slice(-limit);
  }

  getReport(): {
    totalRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number; avgTime: number }>;
  } {
    const endpointStats: Record<string, { count: number; totalTime: number }> = {};

    for (const metric of this.metrics) {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = { count: 0, totalTime: 0 };
      }
      endpointStats[metric.endpoint].count++;
      endpointStats[metric.endpoint].totalTime += metric.responseTime;
    }

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests: this.metrics.length,
      avgResponseTime: this.getAverageResponseTime(),
      p95ResponseTime: this.getP95ResponseTime(),
      errorRate: this.getErrorRate(),
      topEndpoints,
    };
  }
}
