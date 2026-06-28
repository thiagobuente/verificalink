export type SimulationIntensity = "low" | "medium" | "high" | "extreme";
export type SimulatedAttackType = "scanning" | "credential attack" | "malware propagation" | "lateral movement";

export interface SimulationScenario {
  scenarioId: string;
  attackType: string;
  intensity: SimulationIntensity;
  targetPattern: string;
  simulatedImpact: number;
  defenseResponse: string[];
  successProbability: number;
}

export interface AttackSimulationResult {
  scenarioId: string;
  attackType: string;
  propagationScore: number;
  tenantImpact: number;
  correlationDetected: boolean;
  aiOperatorDetected: boolean;
  predictedDetectionGap: boolean;
}

export interface DefenseSimulationResult {
  scenarioId: string;
  defenseEffectiveness: number;
  postureImpact: number;
  recommendedResponses: string[];
  residualRisk: number;
}

export interface SOCResilienceScore {
  detectionRate: number;
  responseEffectiveness: number;
  falsePositiveResistance: number;
  globalThreatResistance: number;
}

export interface SOCGap {
  gapId: string;
  scenarioId: string;
  type: "undetected_attack" | "correlation_failure" | "slow_response" | "ungrouped_campaign";
  severity: number;
  summary: string;
}

export interface WarGameReport {
  timestamp: number;
  scenariosRun: number;
  detectedWeaknesses: string[];
  improvedAreas: string[];
  criticalFailures: string[];
}

export interface WarGameRun {
  runId: string;
  timestamp: number;
  scenarios: SimulationScenario[];
  attackResults: AttackSimulationResult[];
  defenseResults: DefenseSimulationResult[];
  resilienceScore: SOCResilienceScore;
  gaps: SOCGap[];
  report: WarGameReport;
}

export interface SOCEvolutionPoint {
  timestamp: number;
  resilienceScore: SOCResilienceScore;
  scenarioCount: number;
}
