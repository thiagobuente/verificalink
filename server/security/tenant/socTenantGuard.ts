export function assertTenantIsolation<T extends { tenantId?: string }>(tenantId: string, records: T[]): { valid: boolean; violations: number } {
  const violations = records.filter((record) => record.tenantId !== tenantId).length;
  return { valid: violations === 0, violations };
}

export function scopeProviderResult<T extends { tenantId?: string }>(tenantId: string, result: T): T & { tenantId: string } {
  return { ...result, tenantId };
}

export function tenantCacheKey(tenantId: string, key: string): string {
  return tenantId + ":" + key;
}
