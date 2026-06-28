import { anonymizePattern } from "./anonymizer";
import { calculateGlobalThreatScore } from "./globalThreatScoring";
import type { SharedThreatSignal } from "./threatNetwork";

export interface GlobalCampaign {
  campaignId: string;
  patternType: string;
  severity: number;
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  relatedSignals: string[];
  affectedTenants: string[];
  timeline: Array<{ timestamp: number; summary: string }>;
}

const timeWindowMs = 24 * 60 * 60 * 1000;

function fingerprint(signal: SharedThreatSignal): string {
  const bucket = Math.floor(signal.firstSeen / timeWindowMs);
  return [signal.type, signal.hashedValue, String(bucket)].join(":");
}

function campaignId(pattern: string): string {
  return "global_campaign_" + anonymizePattern(pattern).replace("pattern:", "").slice(0, 18);
}

export function detectGlobalCampaigns(signals: SharedThreatSignal[]): GlobalCampaign[] {
  const groups = new Map<string, SharedThreatSignal[]>();
  for (const signal of signals) {
    const key = fingerprint(signal);
    groups.set(key, [...(groups.get(key) ?? []), signal]);
  }

  return [...groups.entries()]
    .map(([pattern, grouped]) => {
      const affectedTenants = [...new Set(grouped.map((signal) => signal.sourceTenant))].sort();
      if (affectedTenants.length < 2 && grouped.length < 3) return undefined;
      const severity = calculateGlobalThreatScore(grouped);
      return {
        campaignId: campaignId(pattern),
        patternType: grouped[0]?.type ?? "ioc",
        severity,
        confidence: Math.min(100, Math.round(grouped.reduce((sum, signal) => sum + signal.confidence, 0) / grouped.length + affectedTenants.length * 5)),
        firstSeen: Math.min(...grouped.map((signal) => signal.firstSeen)),
        lastSeen: Math.max(...grouped.map((signal) => signal.lastSeen)),
        relatedSignals: [...new Set(grouped.map((signal) => signal.signalId))].sort(),
        affectedTenants,
        timeline: grouped.map((signal) => ({ timestamp: signal.lastSeen, summary: "Anonymized shared signal observed" })).sort((a, b) => a.timestamp - b.timestamp),
      } satisfies GlobalCampaign;
    })
    .filter(Boolean)
    .sort((a, b) => b!.severity - a!.severity) as GlobalCampaign[];
}
