/**
 * API Cache Service
 * In-memory release-safe cache fallback.
 */

export interface CacheEntry {
  key: string;
  service: 'virustotal' | 'urlhaus' | 'safebrowsing' | 'whois' | 'other';
  data: unknown;
  expiresAt: Date;
  createdAt: Date;
}

const DEFAULT_TTL = {
  virustotal: 24 * 60 * 60 * 1000,
  urlhaus: 7 * 24 * 60 * 60 * 1000,
  safebrowsing: 24 * 60 * 60 * 1000,
  whois: 30 * 24 * 60 * 60 * 1000,
  other: 60 * 60 * 1000,
};

const cache = new Map<string, CacheEntry>();

function cacheKey(key: string, service: string): string {
  return service + ':' + key;
}

function normalizeService(service: string): CacheEntry['service'] {
  return service === 'virustotal' || service === 'urlhaus' || service === 'safebrowsing' || service === 'whois' ? service : 'other';
}

export async function getCached(key: string, service: string): Promise<unknown | null> {
  const entry = cache.get(cacheKey(key, service));
  if (!entry) return null;
  if (entry.expiresAt <= new Date()) {
    cache.delete(cacheKey(key, service));
    return null;
  }
  return entry.data;
}

export async function setCached(key: string, service: string, data: unknown, ttlMs?: number): Promise<boolean> {
  const normalized = normalizeService(service);
  const ttl = ttlMs ?? DEFAULT_TTL[normalized];
  cache.set(cacheKey(key, service), { key, service: normalized, data, expiresAt: new Date(Date.now() + ttl), createdAt: new Date() });
  return true;
}

export async function deleteCached(key: string, service: string): Promise<boolean> {
  return cache.delete(cacheKey(key, service));
}

export async function clearExpiredCache(): Promise<number> {
  const now = new Date();
  let removed = 0;
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
      removed += 1;
    }
  }
  return removed;
}

export async function getCacheStats(): Promise<{ total: number; byService: Record<string, number>; expired: number }> {
  const now = new Date();
  const entries = [...cache.values()];
  const byService: Record<string, number> = {};
  for (const entry of entries) byService[entry.service] = (byService[entry.service] ?? 0) + 1;
  return { total: entries.length, byService, expired: entries.filter((entry) => entry.expiresAt <= now).length };
}
