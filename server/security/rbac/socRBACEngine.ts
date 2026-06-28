export type SOCRole = "viewer" | "analyst" | "soc_operator" | "soc_admin";
export type SOCPermission = "read" | "correlation" | "actions" | "evolution" | "automation_config";

const permissions: Record<SOCRole, SOCPermission[]> = {
  viewer: ["read"],
  analyst: ["read", "correlation"],
  soc_operator: ["read", "correlation", "actions"],
  soc_admin: ["read", "correlation", "actions", "evolution", "automation_config"],
};

export class SOCRBACEngine {
  can(role: SOCRole, permission: SOCPermission): boolean {
    return permissions[role]?.includes(permission) ?? false;
  }

  require(role: SOCRole, permission: SOCPermission): { allowed: boolean; reason?: string } {
    return this.can(role, permission) ? { allowed: true } : { allowed: false, reason: "RBAC denied " + permission };
  }
}

export const socRBACEngine = new SOCRBACEngine();
