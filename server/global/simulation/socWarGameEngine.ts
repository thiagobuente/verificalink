import { defenseCoordinator } from "../defense/defenseCoordinator";
import { getTenantDefensePosture } from "../defense/defensePostureSync";
import { threatNetwork } from "../intelligence/threatNetwork";
import { attackSimulationEngine } from "./attackSimulationEngine";
import { continuousSimulationScheduler } from "./continuousSimulationScheduler";
import { defenseSimulationEngine } from "./defenseSimulationEngine";
import { gapDetectionEngine } from "./gapDetectionEngine";
import { scenarioGenerator } from "./scenarioGenerator";
import { socEvolutionTracker } from "./socEvolutionTracker";
import { socResilienceScorer } from "./socResilienceScorer";
import { rankSimulatedThreats, type SimulatedThreatRank } from "./simulatedThreatRanking";
import { warGameReportEngine } from "./warGameReportEngine";
import type { SOCGap, SOCResilienceScore, WarGameRun } from "./simulationModels";

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export interface SOCWarGameSnapshot {
  recentSimulations: WarGameRun[];
  resilienceScore: SOCResilienceScore;
  gapsDetected: SOCGap[];
  threatRanking: SimulatedThreatRank[];
  generatedAt: number;
}

const emptyScore: SOCResilienceScore = {
  detectionRate: 0,
  responseEffectiveness: 0,
  falsePositiveResistance: 0,
  globalThreatResistance: 0,
};

export class SOCWarGameEngine {
  runSimulation(tenantId = "global-sandbox"): WarGameRun {
    const threatFeed = threatNetwork.getFeed();
    const defenseFeed = defenseCoordinator.buildFeed();
    const scenarios = scenarioGenerator.generate(threatFeed.campaigns, defenseFeed.defenseRecommendations);
    const attackResults = attackSimulationEngine.simulate(scenarios);
    const defenseResults = defenseSimulationEngine.simulate(scenarios, attackResults, defenseFeed.defenseRecommendations, tenantId === "global-sandbox" ? "balanced" : getTenantDefensePosture(tenantId));
    const resilienceScore = socResilienceScorer.score(attackResults, defenseResults);
    const gaps = gapDetectionEngine.detect(scenarios, attackResults, defenseResults);
    const report = warGameReportEngine.build(scenarios.length, gaps, resilienceScore);
    const run: WarGameRun = {
      runId: "wargame_" + stableHash([tenantId, String(Date.now()), String(scenarios.length)].join("|")),
      timestamp: Date.now(),
      scenarios,
      attackResults,
      defenseResults,
      resilienceScore,
      gaps,
      report,
    };
    continuousSimulationScheduler.record(run);
    socEvolutionTracker.record(resilienceScore, scenarios.length);
    return run;
  }

  snapshot(tenantId = "global-sandbox"): SOCWarGameSnapshot {
    const existing = continuousSimulationScheduler.list();
    const recentSimulations = existing.length > 0 ? existing : [this.runSimulation(tenantId)];
    const latest = recentSimulations[0];
    return {
      recentSimulations: recentSimulations.slice(0, 10),
      resilienceScore: latest?.resilienceScore ?? emptyScore,
      gapsDetected: latest?.gaps ?? [],
      threatRanking: latest ? rankSimulatedThreats(latest.scenarios, latest.attackResults) : [],
      generatedAt: Date.now(),
    };
  }

  startContinuousMode(): void {
    continuousSimulationScheduler.start(() => this.runSimulation());
  }
}

export const socWarGameEngine = new SOCWarGameEngine();
