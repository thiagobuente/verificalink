import type { AttackSimulationResult, DefenseSimulationResult, SOCResilienceScore } from "./simulationModels";

function average(values: number[]): number {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export class SOCResilienceScorer {
  score(attacks: AttackSimulationResult[], defenses: DefenseSimulationResult[]): SOCResilienceScore {
    const detectionRate = attacks.length ? Math.round((attacks.filter((attack) => attack.correlationDetected && attack.aiOperatorDetected).length / attacks.length) * 100) : 0;
    const responseEffectiveness = average(defenses.map((defense) => defense.defenseEffectiveness));
    const falsePositiveResistance = Math.max(0, Math.min(100, 100 - average(attacks.filter((attack) => attack.tenantImpact < 35).map((attack) => attack.propagationScore))));
    const globalThreatResistance = Math.max(0, Math.min(100, Math.round(responseEffectiveness * 0.6 + detectionRate * 0.4)));
    return { detectionRate, responseEffectiveness, falsePositiveResistance, globalThreatResistance };
  }
}

export const socResilienceScorer = new SOCResilienceScorer();
