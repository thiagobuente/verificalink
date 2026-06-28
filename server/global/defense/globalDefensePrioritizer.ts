import type { GlobalCampaign } from "../intelligence/campaignDetector";
import type { SharedThreatSignal } from "../intelligence/threatNetwork";

export function prioritizeGlobalDefense(severity: number, campaign?: GlobalCampaign, signals: SharedThreatSignal[] = []): number {
  const tenantSpread = new Set(signals.map((signal) => signal.sourceTenant)).size;
  let score = severity;
  if (campaign) score += 12;
  if (tenantSpread >= 3) score += 18;
  else if (tenantSpread >= 2) score += 10;
  if (!campaign && tenantSpread <= 1 && signals.length <= 1) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}
