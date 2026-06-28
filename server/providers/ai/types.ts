export type SOCOperatorPriority = "low" | "medium" | "high" | "critical";

export interface SOCOperatorDecision {
  incidentId: string;
  adjustedPriority: SOCOperatorPriority;
  riskReevaluation: number;
  contextSummary: string;
  reasoning: string[];
  confidence: number;
  suggestedFocus: string[];
}
