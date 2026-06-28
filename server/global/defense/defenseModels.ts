export type DefenseActionType = "monitor" | "harden" | "rate_limit" | "block_suggestion";
export type DefenseScope = "local" | "multi-tenant" | "global";
export type DefensePosture = "relaxed" | "balanced" | "hardened" | "locked";
export type WarningLevel = "low" | "medium" | "high" | "critical";

export interface DefenseRecommendation {
  recommendationId: string;
  campaignId?: string;
  severity: number;
  actionType: DefenseActionType;
  scope: DefenseScope;
  confidence: number;
  rationale: string[];
  affectedPatterns: string[];
}

export interface EarlyWarning {
  warningId: string;
  warningLevel: WarningLevel;
  severity: number;
  confidence: number;
  summary: string;
  relatedCampaigns: string[];
  relatedPatterns: string[];
  timestamp: number;
}
