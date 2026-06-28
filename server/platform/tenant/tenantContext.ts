import { AsyncLocalStorage } from "async_hooks";

export type TenantRole = "admin" | "analyst" | "viewer" | "api_client";

export interface TenantAPIKey {
  key: string;
  tenantId: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: number;
  role?: TenantRole;
}

export interface TenantContextValue {
  tenantId: string;
  role: TenantRole;
  permissions: string[];
  apiKey?: string;
  rateLimit: number;
}

const storage = new AsyncLocalStorage<TenantContextValue>();

function parseKeys(): TenantAPIKey[] {
  try {
    const configured = process.env.TENANT_API_KEYS;
    if (!configured) return [];
    return JSON.parse(configured) as TenantAPIKey[];
  } catch {
    return [];
  }
}

export function getTenantApiKeys(): TenantAPIKey[] {
  return parseKeys();
}

export function resolveApiKey(key: string | undefined): TenantAPIKey | undefined {
  if (!key) return undefined;
  const found = getTenantApiKeys().find((item) => item.key === key);
  if (!found) return undefined;
  if (found.expiresAt && Date.now() > found.expiresAt) return undefined;
  return found;
}

export function isRoleAllowed(role: TenantRole, permission: string): boolean {
  if (role === "admin") return true;
  if (role === "analyst") return ["read", "analyze", "replay"].includes(permission);
  if (role === "viewer") return permission === "read";
  return ["read", "analyze"].includes(permission);
}

export function runWithTenant<T>(context: TenantContextValue, callback: () => T): T {
  return storage.run(context, callback);
}

export function getTenantContext(): TenantContextValue | undefined {
  return storage.getStore();
}

export function requireTenantContext(): TenantContextValue {
  const context = getTenantContext();
  if (!context?.tenantId) throw new Error("Tenant context is required");
  return context;
}

export function currentTenantId(): string {
  return requireTenantContext().tenantId;
}
