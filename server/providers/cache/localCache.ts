interface CacheRecord<T> {
  value: T;
  expiresAt: number;
  touchedAt: number;
}

export class LocalProviderCache<T> {
  private readonly entries = new Map<string, CacheRecord<T>>();

  constructor(private readonly maxEntries = Number(process.env.PROVIDER_CACHE_MAX_ENTRIES || 500)) {}

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    entry.touchedAt = Date.now();
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.clearExpired();
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs, touchedAt: Date.now() });
    this.enforceLimit();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  size(): number {
    this.clearExpired();
    return this.entries.size;
  }

  private enforceLimit(): void {
    if (this.entries.size <= this.maxEntries) return;
    const overflow = this.entries.size - this.maxEntries;
    const oldest = [...this.entries.entries()].sort((a, b) => a[1].touchedAt - b[1].touchedAt).slice(0, overflow);
    for (const [key] of oldest) this.entries.delete(key);
  }
}
