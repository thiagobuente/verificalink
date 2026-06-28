import { currentTenantId } from "../../platform/tenant/tenantContext";
import type { AggregatedIocResult } from "../aggregator/iocAggregator";
import type { IocType } from "../interfaces/provider";

interface CacheEntry {
  key: string;
  expiresAt: number;
  value: AggregatedIocResult;
}

export class IncidentCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs = Number(process.env.SOC_INCIDENT_CACHE_TTL_MS || 60 * 1000)) {}

  private key(tenantId: string, ioc: string, type: IocType): string {
    return tenantId + ":" + type + ":" + ioc.toLowerCase();
  }

  get(ioc: string, type: IocType, tenantId = currentTenantId()): AggregatedIocResult | undefined {
    const key = this.key(tenantId, ioc, type);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value.tenantId === tenantId ? entry.value : undefined;
  }

  set(result: AggregatedIocResult, tenantId = result.tenantId): void {
    this.entries.set(this.key(tenantId, result.ioc, result.iocType), {
      key: this.key(tenantId, result.ioc, result.iocType),
      expiresAt: Date.now() + this.ttlMs,
      value: result,
    });
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (now > entry.expiresAt) this.entries.delete(key);
    }
  }

  size(): number {
    this.clearExpired();
    return this.entries.size;
  }
}

export const incidentCache = new IncidentCache();
