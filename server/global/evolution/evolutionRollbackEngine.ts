import type { SOCVersionedConfig } from "./evolutionModels";

export function rollbackToStable(history: SOCVersionedConfig[]): SOCVersionedConfig | undefined {
  return [...history].reverse().find((config) => config.stable);
}
