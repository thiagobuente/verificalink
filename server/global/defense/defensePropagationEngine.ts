import type { SharedThreatSignal } from "../intelligence/threatNetwork";
import { defenseAuditLogger } from "./defenseAudit";
import type { DefenseRecommendation } from "./defenseModels";

export interface PropagatedDefenseRecommendation {
  propagationId: string;
  tenantAudience: string;
  recommendation: DefenseRecommendation;
  message: string;
  timestamp: number;
}

const lastPropagation = new Map<string, number>();
const propagationWindowMs = 30 * 60 * 1000;

function propagationKey(tenantAudience: string, recommendationId: string): string {
  return tenantAudience + ":" + recommendationId;
}

export class DefensePropagationEngine {
  propagate(recommendations: DefenseRecommendation[], signals: SharedThreatSignal[]): PropagatedDefenseRecommendation[] {
    const now = Date.now();
    const audiences = [...new Set(signals.map((signal) => signal.sourceTenant))];
    const propagated: PropagatedDefenseRecommendation[] = [];
    for (const recommendation of recommendations) {
      for (const tenantAudience of audiences) {
        const key = propagationKey(tenantAudience, recommendation.recommendationId);
        if ((lastPropagation.get(key) ?? 0) + propagationWindowMs > now) continue;
        lastPropagation.set(key, now);
        const item: PropagatedDefenseRecommendation = {
          propagationId: key,
          tenantAudience,
          recommendation,
          message: "Anonymized global defense recommendation available for review",
          timestamp: now,
        };
        propagated.push(item);
        defenseAuditLogger.log("recommendation_propagated", "Defense recommendation propagated", { tenantAudience, recommendationId: recommendation.recommendationId });
      }
    }
    return propagated;
  }
}

export const defensePropagationEngine = new DefensePropagationEngine();
