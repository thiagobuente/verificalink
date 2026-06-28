import type { SimulationScenario, AttackSimulationResult } from "./simulationModels";

export class AttackSimulationEngine {
  simulate(scenarios: SimulationScenario[]): AttackSimulationResult[] {
    return scenarios.map((scenario) => {
      const propagationScore = Math.min(100, Math.round(scenario.simulatedImpact * (scenario.intensity === "extreme" ? 1.15 : scenario.intensity === "high" ? 1 : 0.75)));
      const tenantImpact = Math.min(100, Math.round(propagationScore * (scenario.attackType === "lateral movement" ? 1.1 : 0.85)));
      const correlationDetected = propagationScore >= 45 || scenario.defenseResponse.length > 1;
      const aiOperatorDetected = scenario.successProbability < 75 || scenario.simulatedImpact >= 65;
      return {
        scenarioId: scenario.scenarioId,
        attackType: scenario.attackType,
        propagationScore,
        tenantImpact,
        correlationDetected,
        aiOperatorDetected,
        predictedDetectionGap: !correlationDetected || !aiOperatorDetected,
      };
    });
  }
}

export const attackSimulationEngine = new AttackSimulationEngine();
