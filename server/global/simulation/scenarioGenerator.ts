import type { GlobalCampaign } from "../intelligence/campaignDetector";
import type { DefenseRecommendation } from "../defense/defenseModels";
import type { SimulationScenario, SimulatedAttackType, SimulationIntensity } from "./simulationModels";

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function intensityFromSeverity(severity: number): SimulationIntensity {
  if (severity >= 85) return "extreme";
  if (severity >= 70) return "high";
  if (severity >= 45) return "medium";
  return "low";
}

function attackVariants(patternType: string): SimulatedAttackType[] {
  if (/campaign|malware/i.test(patternType)) return ["malware propagation", "lateral movement"];
  if (/scan|ioc/i.test(patternType)) return ["scanning", "credential attack"];
  return ["scanning", "credential attack", "malware propagation", "lateral movement"];
}

export class ScenarioGenerator {
  generate(campaigns: GlobalCampaign[], recommendations: DefenseRecommendation[]): SimulationScenario[] {
    const scenarios = campaigns.flatMap((campaign) => attackVariants(campaign.patternType).map((attackType) => {
      const relatedRecommendation = recommendations.find((recommendation) => recommendation.campaignId === campaign.campaignId);
      const simulatedImpact = Math.min(100, Math.round(campaign.severity * 0.7 + campaign.confidence * 0.3));
      const successProbability = Math.max(5, Math.min(95, simulatedImpact - (relatedRecommendation ? relatedRecommendation.confidence * 0.25 : 0)));
      return {
        scenarioId: "scenario_" + stableHash([campaign.campaignId, attackType].join("|")),
        attackType,
        intensity: intensityFromSeverity(campaign.severity),
        targetPattern: campaign.patternType,
        simulatedImpact,
        defenseResponse: relatedRecommendation ? relatedRecommendation.rationale : ["No coordinated defense recommendation available"],
        successProbability: Math.round(successProbability),
      } satisfies SimulationScenario;
    }));

    if (scenarios.length > 0) return scenarios.slice(0, 50);
    return recommendations.slice(0, 10).map((recommendation) => ({
      scenarioId: "scenario_" + stableHash([recommendation.recommendationId, recommendation.actionType].join("|")),
      attackType: recommendation.actionType === "rate_limit" ? "scanning" : "credential attack",
      intensity: intensityFromSeverity(recommendation.severity),
      targetPattern: recommendation.affectedPatterns[0] ?? "anonymized-pattern",
      simulatedImpact: recommendation.severity,
      defenseResponse: recommendation.rationale,
      successProbability: Math.max(5, Math.min(90, recommendation.severity - recommendation.confidence * 0.2)),
    }));
  }
}

export const scenarioGenerator = new ScenarioGenerator();
