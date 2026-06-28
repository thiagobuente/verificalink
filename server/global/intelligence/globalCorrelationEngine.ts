import { detectGlobalCampaigns, type GlobalCampaign } from "./campaignDetector";
import { calculateGlobalThreatScore } from "./globalThreatScoring";
import type { SharedThreatSignal } from "./threatNetwork";

export interface GlobalCorrelationResult {
  campaigns: GlobalCampaign[];
  emergingPatterns: Array<{ patternType: string; signalCount: number; tenantSpread: number; score: number; summary: string }>;
  largeScaleAttackDetected: boolean;
}

export function correlateGlobalThreats(signals: SharedThreatSignal[]): GlobalCorrelationResult {
  const campaigns = detectGlobalCampaigns(signals);
  const byType = new Map<string, SharedThreatSignal[]>();
  for (const signal of signals) byType.set(signal.type, [...(byType.get(signal.type) ?? []), signal]);
  const emergingPatterns = [...byType.entries()].map(([patternType, grouped]) => {
    const tenantSpread = new Set(grouped.map((signal) => signal.sourceTenant)).size;
    return {
      patternType,
      signalCount: grouped.length,
      tenantSpread,
      score: calculateGlobalThreatScore(grouped),
      summary: tenantSpread > 1 ? "Repeated anonymized pattern observed across organizations" : "Isolated anonymized pattern observed",
    };
  }).sort((a, b) => b.score - a.score);
  return {
    campaigns,
    emergingPatterns,
    largeScaleAttackDetected: campaigns.some((campaign) => campaign.severity >= 70 && campaign.affectedTenants.length >= 2),
  };
}
