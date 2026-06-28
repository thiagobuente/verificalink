import { resolveApiKey, type TenantRole } from "../../platform/tenant/tenantContext";

export type EnterpriseRole = "security_admin" | "soc_analyst" | "soc_manager" | "auditor" | "api_service";
export type SSOProtocol = "oidc" | "saml" | "api_key";

export interface UserContext {
  userId: string;
  tenantId: string;
  role: EnterpriseRole;
  permissions: string[];
}

export interface SSOAssertion {
  protocol: SSOProtocol;
  subject?: string;
  tenantId?: string;
  role?: EnterpriseRole;
  permissions?: string[];
  apiKey?: string;
  claims?: Record<string, unknown>;
}

function permissionsFor(role: EnterpriseRole): string[] {
  if (role === "security_admin") return ["*"];
  if (role === "soc_manager") return ["read", "analyze", "replay", "manage_cases", "export", "logs"];
  if (role === "soc_analyst") return ["read", "analyze", "replay", "investigate"];
  if (role === "auditor") return ["read", "logs", "export"];
  return ["read", "analyze"];
}

export function mapEnterpriseRoleToTenantRole(role: EnterpriseRole): TenantRole {
  if (role === "security_admin") return "admin";
  if (role === "soc_analyst" || role === "soc_manager") return "analyst";
  if (role === "auditor") return "viewer";
  return "api_client";
}

export class SSOProvider {
  authenticate(assertion: SSOAssertion): UserContext | undefined {
    if (assertion.protocol === "api_key") {
      const key = resolveApiKey(assertion.apiKey);
      if (!key) return undefined;
      const role: EnterpriseRole = key.role === "admin" ? "security_admin" : key.role === "viewer" ? "auditor" : "api_service";
      return { userId: key.key, tenantId: key.tenantId, role, permissions: key.permissions };
    }
    const tenantId = assertion.tenantId ?? String(assertion.claims?.tenantId ?? "");
    const userId = assertion.subject ?? String(assertion.claims?.sub ?? "");
    if (!tenantId || !userId) return undefined;
    const role = assertion.role ?? "soc_analyst";
    return {
      userId,
      tenantId,
      role,
      permissions: assertion.permissions ?? permissionsFor(role),
    };
  }
}

export const ssoProvider = new SSOProvider();
