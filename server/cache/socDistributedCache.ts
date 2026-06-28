interface CacheEntry<T> { value: T; expiresAt: number; criticality: "low" | "medium" | "high"; }
const cache = new Map<string, CacheEntry<unknown>>();
function ttl(criticality: "low" | "medium" | "high") { return criticality === "high" ? 30_000 : criticality === "medium" ? 120_000 : 300_000; }
export class SOCDistributedCache {
  key(tenantId: string, stage: string, key: string) { return tenantId + ":" + stage + ":" + key; }
  set<T>(tenantId: string, stage: string, key: string, value: T, criticality: "low" | "medium" | "high" = "medium") { cache.set(this.key(tenantId, stage, key), { value, criticality, expiresAt: Date.now() + ttl(criticality) }); }
  get<T>(tenantId: string, stage: string, key: string): T | undefined { const entry = cache.get(this.key(tenantId, stage, key)); if (!entry || Date.now() > entry.expiresAt) return undefined; return entry.value as T; }
}
export const socDistributedCache = new SOCDistributedCache();
