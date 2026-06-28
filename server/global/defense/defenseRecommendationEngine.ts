import type { GlobalCampaign } from "../intelligence/campaignDetector";
import type { SharedThreatSignal } from "../intelligence/threatNetwork";
import { defenseAuditLogger } from "./defenseAudit";
import type { DefenseActionType, DefenseRecommendation, DefenseScope } from "./defenseModels";
import { prioritizeGlobalDefense } from "./globalDefensePrioritizer";

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function actionFor(score: number, hasGlobalCampaign: boolean, repeatedIoc: boolean, distributed: boolean): DefenseActionType {
  if (score >= 85 && hasGlobalCampaign && repeatedIoc) return "block_suggestion";
  if (score >= 70 || distributed) return "rate_limit";
  if (score >= 45 || hasGlobalCampaign) return "harden";
  return "monitor";
}

function scopeFor(tenantSpread: number): DefenseScope {
  if (tenantSpread >= 3) return "global";
  if (tenantSpread >= 2) return "multi-tenant";
  return "local";
}

function recommendationKey(campaignId: string | undefined, actionType: DefenseActionType, patterns: string[]): string {
  return "def_rec_" + stableHash([campaignId ?? "no_campaign", actionType, ...patterns.sort()].join("|"));
}

export class DefenseRecommendationEngine {
  generate(campaigns: GlobalCampaign[], signals: SharedThreatSignal[]): DefenseRecommendation[] {
    const recommendations = new Map<string, DefenseRecommendation>();
    const now = Date.now();

    for (const campaign of campaigns) {
      const relatedSignals = signals.filter((signal) => campaign.relatedSignals.includes(signal.signalId));
      const tenantSpread = new Set(relatedSignals.map((signal) => signal.sourceTenant)).size || campaign.affectedTenants.length;
      const repeatedIoc = relatedSignals.filter((signal) => signal.type === "ioc").length >= 2;
      const distributed = tenantSpread >= 2;
      const severity = prioritizeGlobalDefense(campaign.severity, campaign, relatedSignals);
      const actionType = actionFor(severity, true, repeatedIoc, distributed);
      const affectedPatterns = [...new Set(relatedSignals.map((signal) => signal.hashedValue))].slice(0, 12);
      const recommendation: DefenseRecommendation = {
        recommendationId: recommendationKey(campaign.campaignId, actionType, affectedPatterns),
        campaignId: campaign.campaignId,
        severity,
        actionType,
        scope: scopeFor(tenantSpread),
        confidence: campaign.confidence,
        rationale: [
          "Global campaign detected from anonymized shared intelligence",
          distributed ? "Pattern appears across multiple opted-in organizations" : "Pattern currently appears limited",
          actionType === "block_suggestion" ? "Repeated anonymized IOC observed; blocking is suggested only and never executed" : "Defensive response remains advisory",
        ],
        affectedPatterns,
      };
      recommendations.set(recommendation.recommendationId, recommendation);
      defenseAuditLogger.log("recommendation_generated", "Global defense recommendation generated", { recommendationId: recommendation.recommendationId, actionType, campaignId: campaign.campaignId, generatedAt: now });
    }

    const groupedSignals = new Map<string, SharedThreatSignal[]>();
    for (const signal of signals) groupedSignals.set(signal.hashedValue, [...(groupedSignals.get(signal.hashedValue) ?? []), signal]);
    for (const [hashedValue, grouped] of groupedSignals.entries()) {
      if ([...recommendations.values()].some((recommendation) => recommendation.affectedPatterns.includes(hashedValue))) continue;
      const tenantSpread = new Set(grouped.map((signal) => signal.sourceTenant)).size;
      const severity = prioritizeGlobalDefense(Math.max(...grouped.map((signal) => signal.severity)), undefined, grouped);
      const actionType = actionFor(severity, false, grouped.length > 1, tenantSpread >= 2);
      const recommendation: DefenseRecommendation = {
        recommendationId: recommendationKey(undefined, actionType, [hashedValue]),
        severity,
        actionType,
        scope: scopeFor(tenantSpread),
        confidence: Math.max(...grouped.map((signal) => signal.confidence)),
        rationale: tenantSpread >= 2 ? ["Repeated anonymized IOC observed across tenants", "Blocking is suggested only and requires local approval"] : ["Isolated anonymized signal observed", "Monitor for additional activity"],
        affectedPatterns: [hashedValue],
      };
      recommendations.set(recommendation.recommendationId, recommendation);
      defenseAuditLogger.log("recommendation_generated", "Signal-based defense recommendation generated", { recommendationId: recommendation.recommendationId, actionType });
    }

    return [...recommendations.values()].sort((a, b) => b.severity - a.severity).slice(0, 100);
  }
}

export const defenseRecommendationEngine = new DefenseRecommendationEngine();
