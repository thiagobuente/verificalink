export type AutomationLevel = "manual_only" | "assisted" | "semi_auto" | "auto_safe_only";
export type AutonomousActionStatus = "executed" | "pending" | "blocked" | "rolled_back";

export interface AutonomousActionRecord {
  id: string;
  tenantId: string;
  incidentId: string;
  actionType: string;
  automationLevel: AutomationLevel;
  status: AutonomousActionStatus;
  confidence: number;
  rationale: string[];
  reversible: boolean;
  timestamp: number;
}
