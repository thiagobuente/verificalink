import type { GlobalCampaign } from "../intelligence/campaignDetector";
import type { SharedThreatSignal } from "../intelligence/threatNetwork";
import type { EarlyWarning, WarningLevel } from "./defenseModels";

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function level(score: number): WarningLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export class EarlyWarningEngine {
  detect(campaigns: GlobalCampaign[], signals: SharedThreatSignal[]): EarlyWarning[] {
    const now = Date.now();
    const recentSignals = signals.filter((signal) => now - signal.lastSeen <= 60 * 60 * 1000);
    const warnings: EarlyWarning[] = [];
    for (const campaign of campaigns) {
      const related = recentSignals.filter((signal) => campaign.relatedSignals.includes(signal.signalId));
      const tenantSpread = new Set(related.map((signal) => signal.sourceTenant)).size;
      const growthScore = Math.min(100, campaign.severity + related.length * 4 + tenantSpread * 8);
      if (related.length >= 2 || tenantSpread >= 2 || campaign.severity >= 70) {
        warnings.push({
          warningId: "warning_" + stableHash([campaign.campaignId, String(Math.floor(now / 3600000))].join("|")),
          warningLevel: level(growthScore),
          severity: growthScore,
          confidence: Math.min(100, campaign.confidence + tenantSpread * 4),
          summary: "Rapid growth or propagation detected in anonymized global campaign signals",
          relatedCampaigns: [campaign.campaignId],
          relatedPatterns: [...new Set(related.map((signal) => signal.hashedValue))].slice(0, 10),
          timestamp: now,
        });
      }
    }
    return warnings.sort((a, b) => b.severity - a.severity).slice(0, 50);
  }
}

export const earlyWarningEngine = new EarlyWarningEngine();
