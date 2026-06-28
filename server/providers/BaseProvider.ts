import type { IocQuery, IocType, NormalizedThreatResult, ProviderHealthSnapshot, ProviderStatus, ThreatIntelProvider } from "./interfaces/provider";

export abstract class BaseProvider implements ThreatIntelProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly timeoutMs: number;
  abstract readonly supportedTypes: IocType[];

  private totalQueries = 0;
  private failedQueries = 0;
  private lastLatency = 0;
  private lastQuery?: string;
  private lastError?: string;

  abstract isConfigured(): boolean;
  abstract analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult>;

  protected markSuccess(latency: number): void {
    this.totalQueries += 1;
    this.lastLatency = latency;
    this.lastQuery = new Date().toISOString();
    this.lastError = undefined;
  }

  protected markFailure(error: unknown): void {
    this.totalQueries += 1;
    this.failedQueries += 1;
    this.lastQuery = new Date().toISOString();
    this.lastError = error instanceof Error ? error.message : String(error);
  }

  protected buildHealth(): ProviderHealthSnapshot {
    const status: ProviderStatus = !this.isConfigured()
      ? "unconfigured"
      : this.lastError
        ? "degraded"
        : "online";
    const successes = Math.max(0, this.totalQueries - this.failedQueries);
    const uptime = this.totalQueries === 0 ? (this.isConfigured() ? 100 : 0) : (successes / this.totalQueries) * 100;

    return {
      id: this.id,
      name: this.name,
      status,
      latency: this.lastLatency,
      lastQuery: this.lastQuery,
      errors: this.failedQueries,
      lastError: this.lastError,
      uptime,
      responseTime: this.lastLatency,
    };
  }

  getHealth(): ProviderHealthSnapshot {
    return this.buildHealth();
  }

  protected supports(type: IocType): boolean {
    return this.supportedTypes.includes(type);
  }
}
