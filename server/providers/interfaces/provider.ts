export type IocType = "ip" | "domain" | "url" | "hash" | "email" | "unknown";
export type ProviderStatus = "online" | "degraded" | "offline" | "unconfigured";

export interface IocQuery {
  value: string;
  type?: IocType;
  tenantId?: string;
}

export interface ThreatTimelineEvent {
  timestamp: string;
  title: string;
  description?: string;
  source: string;
}

export interface NormalizedThreatResult {
  providerId: string;
  providerName: string;
  ioc: string;
  iocType: IocType;
  riskScore: number;
  malicious: boolean;
  reputation: "malicious" | "suspicious" | "neutral" | "trusted" | "unknown";
  confidence: number;
  country?: string;
  asn?: string;
  tags: string[];
  categories: string[];
  references: string[];
  timeline: ThreatTimelineEvent[];
  raw?: unknown;
  queriedAt: string;
}

export interface ProviderHealthSnapshot {
  id: string;
  name: string;
  status: ProviderStatus;
  latency: number;
  lastQuery?: string;
  errors: number;
  lastError?: string;
  uptime: number;
  responseTime: number;
}

export interface ThreatIntelProvider {
  id: string;
  name: string;
  timeoutMs: number;
  supportedTypes: IocType[];
  isConfigured(): boolean;
  analyze(query: Required<IocQuery>, signal: AbortSignal): Promise<NormalizedThreatResult>;
  getHealth(): ProviderHealthSnapshot;
}

export interface ProviderExecutionOptions {
  timeoutMs: number;
  retries: number;
  retryBaseDelayMs: number;
  cacheTtlMs: number;
}
