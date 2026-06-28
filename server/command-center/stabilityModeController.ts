import type { SOCDriftStatus } from "../global/evolution/evolutionModels";

export type CommandCenterStabilityMode = "normal" | "degraded" | "recovery";

let mode: CommandCenterStabilityMode = "normal";

export function updateStabilityMode(input: { drift?: SOCDriftStatus; evolutionUnstable?: boolean; feedEmptyCycles?: number }): CommandCenterStabilityMode {
  if (input.evolutionUnstable || input.drift?.mode === "unstable") mode = "recovery";
  else if (input.drift?.driftDetected || (input.feedEmptyCycles ?? 0) > 2) mode = "degraded";
  else mode = "normal";
  return mode;
}

export function getStabilityMode(): CommandCenterStabilityMode {
  return mode;
}
