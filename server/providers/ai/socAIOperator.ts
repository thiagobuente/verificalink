import type { SOCAction } from "../actions/socActionEngine";
import type { IocCorrelationResult } from "../correlation/correlationEngine";
import type { Incident } from "../decision/incidentEngine";
import type { AttackIntelligence } from "../intelligence/attackIntelligenceEngine";
import type { AttackNarrative } from "../narrative/attackNarrativeEngine";
import { currentTenantId } from "../../platform/tenant/tenantContext";
import type { GlobalCampaign } from "../../global/intelligence/campaignDetector";
import type { SharedThreatSignal } from "../../global/intelligence/threatNetwork";
import type { DefenseRecommendation, DefensePosture, EarlyWarning } from "../../global/defense/defenseModels";
import type { SOCGap, SOCResilienceScore, WarGameRun } from "../../global/simulation/simulationModels";
import { adjustPriority, calculateHiddenRisk } from "./heuristics";
import type { SOCOperatorDecision, SOCOperatorPriority } from "./types";

export interface SocAIOperatorInput {
  incident: Incident;
  correlation?: IocCorrelationResult;
  attackIntelligence?: AttackIntelligence;
  narrative?: AttackNarrative;
  actions?: SOCAction[];
  globalCampaigns?: GlobalCampaign[];
  sharedThreatSignals?: SharedThreatSignal[];
  defenseRecommendations?: DefenseRecommendation[];
  defensePosture?: DefensePosture;
  earlyWarnings?: EarlyWarning[];
  simulationResults?: WarGameRun[];
  resilienceScore?: SOCResilienceScore;
  detectedGaps?: SOCGap[];
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function providerCount(input: SocAIOperatorInput): number {
  const sources = input.correlation?.timeline.flatMap((event) => event.sources) ?? input.incident.sources;
  return new Set(sources).size;
}

function conflictingSignals(input: SocAIOperatorInput): number {
  const messages = [
    ...(input.correlation?.correlationExplanation ?? []),
    ...(input.narrative?.evidence ?? []),
    ...(input.actions ?? []).flatMap((action) => action.rationale),
  ];
  return messages.filter((message) => /conflict|benign|reducing severity|low-confidence/i.test(message)).length;
}

function hasCampaignSignal(input: SocAIOperatorInput): boolean {
  const text = [
    input.attackIntelligence?.summary,
    input.attackIntelligence?.attackType,
    ...(input.narrative?.attackFlow ?? []),
    ...(input.narrative?.detailedExplanation ?? []),
  ].filter(Boolean).join(" ");
  return /campaign|coordinated|multiple/i.test(text);
}

function buildContext(riskReevaluation: number, correlationScore: number, globalCampaignCount = 0): string {
  if (globalCampaignCount > 0) return "Global anonymized threat pattern adds context to this incident.";
  if (riskReevaluation > correlationScore) return "Hidden risk detected from combined weak signals.";
  if (correlationScore > 70) return "Strong correlation detected across available intelligence.";
  return "Low-confidence signals require cautious interpretation.";
}

function buildReasoning(input: SocAIOperatorInput, riskReevaluation: number, correlationScore: number, conflicts: number): string[] {
  return unique([
    providerCount(input) > 1 ? "Multiple provider signals were considered together." : undefined,
    riskReevaluation > correlationScore ? "Several weak signals increased the hidden risk estimate." : undefined,
    conflicts > 0 ? "Conflicting provider signals reduced confidence." : undefined,
    hasCampaignSignal(input) ? "Campaign-like behavior was mentioned in intelligence or narrative context." : undefined,
    input.globalCampaigns?.length ? "An anonymized global campaign pattern overlaps with this incident context." : undefined,
    input.sharedThreatSignals?.length ? "Shared anonymized threat signals are available for comparison." : undefined,
    input.defenseRecommendations?.length ? "Global defensive posture recommends additional review for this pattern." : undefined,
    input.earlyWarnings?.some((warning) => warning.warningLevel === "high" || warning.warningLevel === "critical") ? "Early warning indicates fast-growing anonymized activity." : undefined,
    input.detectedGaps?.length ? "Recent simulation gaps suggest areas needing SOC validation." : undefined,
    correlationScore > 70 ? "Strong correlation exists between sources." : undefined,
    input.attackIntelligence && input.attackIntelligence.confidence > 70 ? "Attack intelligence has high confidence." : undefined,
  ]).slice(0, 8);
}

function buildFocus(priority: SOCOperatorPriority): string[] {
  if (priority === "critical") return ["Immediate investigation", "Validate exposed infrastructure", "Review anonymized global campaign context", "Review simulation gaps", "Review coordinated defense recommendations", "Review block recommendations before approval"];
  if (priority === "high") return ["Review correlation evidence", "Analyze possible campaign context", "Compare anonymized shared signals", "Review rate limiting or hardening suggestions", "Validate SOC response readiness"];
  if (priority === "medium") return ["Continue monitoring", "Collect additional provider evidence", "Review related IOCs"];
  return ["Passive observation", "Track future changes", "Avoid aggressive response without more evidence"];
}

function calculateConfidence(input: SocAIOperatorInput): number {
  let confidence = 60;
  if ((input.correlation?.correlationScore ?? 0) > 70) confidence += 20;
  if ((input.attackIntelligence?.confidence ?? 0) > 70) confidence += 10;
  if ((input.globalCampaigns?.length ?? 0) > 0) confidence += 5;
  if ((input.defenseRecommendations?.length ?? 0) > 0) confidence += 5;
  if ((input.resilienceScore?.detectionRate ?? 100) < 60) confidence += 5;
  return clampScore(confidence);
}

export class SocAIOperator {
  execute(input: SocAIOperatorInput): SOCOperatorDecision {
    currentTenantId();
    const correlationScore = input.correlation?.correlationScore ?? 0;
    const conflicts = conflictingSignals(input);
    const riskReevaluation = clampScore(calculateHiddenRisk({
      correlationScore,
      providerCount: providerCount(input),
      conflictingSignals: conflicts,
    }) + Math.min(15, (input.globalCampaigns?.length ?? 0) * 5) + Math.min(10, (input.defenseRecommendations?.length ?? 0) * 3) + (input.earlyWarnings?.some((warning) => warning.warningLevel === "critical") ? 8 : 0) + Math.min(12, (input.detectedGaps?.length ?? 0) * 2));
    const adjustedPriority = adjustPriority(riskReevaluation);

    return {
      incidentId: input.incident.id,
      adjustedPriority,
      riskReevaluation,
      contextSummary: buildContext(riskReevaluation, correlationScore, input.globalCampaigns?.length ?? 0),
      reasoning: buildReasoning(input, riskReevaluation, correlationScore, conflicts),
      confidence: calculateConfidence(input),
      suggestedFocus: buildFocus(adjustedPriority),
    };
  }
}

export const socAIOperator = new SocAIOperator();
