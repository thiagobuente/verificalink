import { updateStabilityMode } from "../command-center/stabilityModeController";

export function triggerSOCRecovery(input: { driftUnstable?: boolean; providerFailureCluster?: boolean; commandCenterDegraded?: boolean }) {
  const active = Boolean(input.driftUnstable || input.providerFailureCluster || input.commandCenterDegraded);
  const mode = updateStabilityMode({ evolutionUnstable: input.driftUnstable, feedEmptyCycles: input.commandCenterDegraded ? 3 : 0 });
  return { active, mode, actions: active ? ["reduce update frequency", "use last known good cache", "suppress duplicate alerts"] : [] };
}
