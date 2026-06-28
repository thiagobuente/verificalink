import type { AttackSimulationResult, SimulationScenario } from "./simulationModels";

export interface SimulatedThreatRank {
  scenarioId: string;
  attackType: string;
  rankScore: number;
  reason: string;
}

export function rankSimulatedThreats(scenarios: SimulationScenario[], attacks: AttackSimulationResult[]): SimulatedThreatRank[] {
  return scenarios.map((scenario) => {
    const attack = attacks.find((item) => item.scenarioId === scenario.scenarioId);
    const rankScore = Math.min(100, Math.round(scenario.successProbability * 0.5 + scenario.simulatedImpact * 0.3 + (attack?.tenantImpact ?? 0) * 0.2));
    return {
      scenarioId: scenario.scenarioId,
      attackType: scenario.attackType,
      rankScore,
      reason: rankScore >= 75 ? "High probability and high simulated impact" : rankScore >= 50 ? "Likely scenario with moderate impact" : "Lower priority simulated vector",
    };
  }).sort((a, b) => b.rankScore - a.rankScore);
}
