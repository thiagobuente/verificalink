import { threatNetwork } from "../intelligence/threatNetwork";
import type { GlobalCampaign } from "../intelligence/campaignDetector";
import type { SharedThreatSignal } from "../intelligence/threatNetwork";
import { defenseRecommendationEngine } from "./defenseRecommendationEngine";
import { defensePropagationEngine, type PropagatedDefenseRecommendation } from "./defensePropagationEngine";
import { buildGlobalDefenseMap, type GlobalDefenseMap } from "./globalDefenseMap";
import { earlyWarningEngine } from "./earlyWarningEngine";
import type { DefenseRecommendation, EarlyWarning } from "./defenseModels";

export interface GlobalDefenseFeed {
  defenseRecommendations: DefenseRecommendation[];
  activeCampaigns: GlobalCampaign[];
  earlyWarnings: EarlyWarning[];
  defenseMap: GlobalDefenseMap;
  propagatedRecommendations: PropagatedDefenseRecommendation[];
  sharedSignalCount: number;
  generatedAt: number;
}

export class DefenseCoordinator {
  buildFeed(): GlobalDefenseFeed {
    const threatFeed = threatNetwork.getFeed();
    const signals: SharedThreatSignal[] = threatNetwork.listSignals();
    const recommendations = defenseRecommendationEngine.generate(threatFeed.campaigns, signals);
    const propagatedRecommendations = defensePropagationEngine.propagate(recommendations, signals);
    const earlyWarnings = earlyWarningEngine.detect(threatFeed.campaigns, signals);
    return {
      defenseRecommendations: recommendations,
      activeCampaigns: threatFeed.campaigns,
      earlyWarnings,
      defenseMap: buildGlobalDefenseMap(threatFeed.campaigns, signals, recommendations),
      propagatedRecommendations,
      sharedSignalCount: signals.length,
      generatedAt: Date.now(),
    };
  }
}

export const defenseCoordinator = new DefenseCoordinator();
