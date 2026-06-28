interface CacheRecord<T> {
  value: T;
  expiresAt: number;
}

export class LocalProviderCache<T> {
  private readonly entries = new Map<string, CacheRecord<T>>();

  get(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }
}
