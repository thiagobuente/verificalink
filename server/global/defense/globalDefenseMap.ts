import type { GlobalCampaign } from "../intelligence/campaignDetector";
import type { SharedThreatSignal } from "../intelligence/threatNetwork";
import type { DefenseRecommendation } from "./defenseModels";

export interface GlobalDefenseMapRegion {
  region: string;
  riskLevel: number;
  activeClusters: number;
  defensivePosture: "relaxed" | "balanced" | "hardened" | "locked";
}

export interface GlobalDefenseMap {
  generatedAt: number;
  regions: GlobalDefenseMapRegion[];
  activeAttackClusters: Array<{ clusterId: string; severity: number; patternType: string }>;
  aggregatePosture: "relaxed" | "balanced" | "hardened" | "locked";
}

function abstractRegion(signal: SharedThreatSignal): string {
  const code = signal.sourceTenant.slice(-2).toUpperCase();
  return "region-" + code;
}

function postureFromRisk(risk: number): GlobalDefenseMapRegion["defensivePosture"] {
  if (risk >= 85) return "locked";
  if (risk >= 65) return "hardened";
  if (risk >= 35) return "balanced";
  return "relaxed";
}

export function buildGlobalDefenseMap(campaigns: GlobalCampaign[], signals: SharedThreatSignal[], recommendations: DefenseRecommendation[]): GlobalDefenseMap {
  const regions = new Map<string, SharedThreatSignal[]>();
  for (const signal of signals) regions.set(abstractRegion(signal), [...(regions.get(abstractRegion(signal)) ?? []), signal]);
  const regionList = [...regions.entries()].map(([region, grouped]) => {
    const recommendationBoost = recommendations.some((recommendation) => recommendation.scope !== "local") ? 10 : 0;
    const riskLevel = Math.min(100, Math.round(Math.max(...grouped.map((signal) => signal.severity), 0) + recommendationBoost));
    return {
      region,
      riskLevel,
      activeClusters: new Set(grouped.map((signal) => signal.hashedValue)).size,
      defensivePosture: postureFromRisk(riskLevel),
    };
  }).sort((a, b) => b.riskLevel - a.riskLevel);
  const maxRisk = Math.max(...regionList.map((region) => region.riskLevel), 0);
  return {
    generatedAt: Date.now(),
    regions: regionList,
    activeAttackClusters: campaigns.map((campaign) => ({ clusterId: campaign.campaignId, severity: campaign.severity, patternType: campaign.patternType })),
    aggregatePosture: postureFromRisk(maxRisk),
  };
}
