export type SOCAutonomousMode = "OFF" | "ASSISTED" | "LIMITED_AUTO" | "FULL_AUTO";

let mode: SOCAutonomousMode = "ASSISTED";

export function setSOCAutonomousMode(nextMode: SOCAutonomousMode): SOCAutonomousMode {
  mode = nextMode;
  return mode;
}

export function getSOCAutonomousMode(): SOCAutonomousMode {
  return mode;
}

export function canAutoExecuteSafeActions(systemHealthScore = 100): boolean {
  if (mode === "LIMITED_AUTO") return true;
  if (mode === "FULL_AUTO") return systemHealthScore > 90;
  return false;
}

export function describeSOCAutonomousMode(systemHealthScore = 100) {
  return {
    mode,
    canExecuteSafeActions: canAutoExecuteSafeActions(systemHealthScore),
    constraints: mode === "FULL_AUTO" && systemHealthScore <= 90 ? ["FULL_AUTO requires system health > 90"] : [],
  };
}
