import type { DefenseRecommendation, DefensePosture } from "../defense/defenseModels";
import type { AttackSimulationResult, DefenseSimulationResult, SimulationScenario } from "./simulationModels";

function postureModifier(posture: DefensePosture): number {
  if (posture === "locked") return 22;
  if (posture === "hardened") return 14;
  if (posture === "balanced") return 6;
  return -6;
}

export class DefenseSimulationEngine {
  simulate(scenarios: SimulationScenario[], attacks: AttackSimulationResult[], recommendations: DefenseRecommendation[], posture: DefensePosture = "balanced"): DefenseSimulationResult[] {
    return scenarios.map((scenario) => {
      const attack = attacks.find((item) => item.scenarioId === scenario.scenarioId);
      const related = recommendations.find((recommendation) => recommendation.affectedPatterns.includes(scenario.targetPattern) || recommendation.campaignId && scenario.scenarioId.includes(recommendation.campaignId));
      const recommendationBoost = related ? related.confidence * 0.25 : 0;
      const detectionBoost = attack?.correlationDetected ? 18 : -12;
      const defenseEffectiveness = Math.max(0, Math.min(100, Math.round(45 + recommendationBoost + detectionBoost + postureModifier(posture))));
      return {
        scenarioId: scenario.scenarioId,
        defenseEffectiveness,
        postureImpact: postureModifier(posture),
        recommendedResponses: related ? [related.actionType, ...related.rationale] : scenario.defenseResponse,
        residualRisk: Math.max(0, Math.min(100, Math.round((attack?.tenantImpact ?? scenario.simulatedImpact) - defenseEffectiveness * 0.55))),
      };
    });
  }
}

export const defenseSimulationEngine = new DefenseSimulationEngine();
