import type { SOCGap, SOCResilienceScore, WarGameReport } from "./simulationModels";

export class WarGameReportEngine {
  build(scenariosRun: number, gaps: SOCGap[], resilienceScore: SOCResilienceScore): WarGameReport {
    return {
      timestamp: Date.now(),
      scenariosRun,
      detectedWeaknesses: gaps.slice(0, 10).map((gap) => gap.summary),
      improvedAreas: [
        resilienceScore.detectionRate >= 70 ? "Detection coverage is resilient in simulated global scenarios" : undefined,
        resilienceScore.responseEffectiveness >= 70 ? "Response recommendations appear effective" : undefined,
        resilienceScore.globalThreatResistance >= 70 ? "Global threat resistance is improving" : undefined,
      ].filter(Boolean) as string[],
      criticalFailures: gaps.filter((gap) => gap.severity >= 80).map((gap) => gap.summary),
    };
  }
}

export const warGameReportEngine = new WarGameReportEngine();
