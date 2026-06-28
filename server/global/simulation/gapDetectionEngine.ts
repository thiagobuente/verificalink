import type { AttackSimulationResult, DefenseSimulationResult, SOCGap, SimulationScenario } from "./simulationModels";

function gapId(scenarioId: string, type: SOCGap["type"]): string {
  return "gap_" + scenarioId + "_" + type;
}

export class GapDetectionEngine {
  detect(scenarios: SimulationScenario[], attacks: AttackSimulationResult[], defenses: DefenseSimulationResult[]): SOCGap[] {
    const gaps: SOCGap[] = [];
    for (const scenario of scenarios) {
      const attack = attacks.find((item) => item.scenarioId === scenario.scenarioId);
      const defense = defenses.find((item) => item.scenarioId === scenario.scenarioId);
      if (!attack) continue;
      if (!attack.aiOperatorDetected) gaps.push({ gapId: gapId(scenario.scenarioId, "undetected_attack"), scenarioId: scenario.scenarioId, type: "undetected_attack", severity: attack.tenantImpact, summary: "AI detection may miss this simulated attack path" });
      if (!attack.correlationDetected) gaps.push({ gapId: gapId(scenario.scenarioId, "correlation_failure"), scenarioId: scenario.scenarioId, type: "correlation_failure", severity: attack.propagationScore, summary: "Correlation may not group this simulated activity" });
      if ((defense?.defenseEffectiveness ?? 0) < 45 && attack.tenantImpact > 60) gaps.push({ gapId: gapId(scenario.scenarioId, "slow_response"), scenarioId: scenario.scenarioId, type: "slow_response", severity: attack.tenantImpact, summary: "Defensive response may be too weak for expected impact" });
      if (scenario.attackType === "lateral movement" && !scenario.defenseResponse.some((item) => /campaign|correlation|global/i.test(item))) gaps.push({ gapId: gapId(scenario.scenarioId, "ungrouped_campaign"), scenarioId: scenario.scenarioId, type: "ungrouped_campaign", severity: scenario.simulatedImpact, summary: "Campaign grouping may be insufficient for lateral movement" });
    }
    return gaps.sort((a, b) => b.severity - a.severity).slice(0, 100);
  }
}

export const gapDetectionEngine = new GapDetectionEngine();
