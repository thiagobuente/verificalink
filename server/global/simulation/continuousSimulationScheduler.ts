import type { WarGameRun } from "./simulationModels";

let intervalHandle: ReturnType<typeof setInterval> | undefined;
const reports: WarGameRun[] = [];

export class ContinuousSimulationScheduler {
  start(runSimulation: () => WarGameRun, intervalMs = Number(process.env.SOC_WARGAME_INTERVAL_MS || 60 * 60 * 1000)): void {
    if (intervalHandle) return;
    intervalHandle = setInterval(() => {
      try {
        reports.push(runSimulation());
        if (reports.length > 100) reports.shift();
      } catch {
        // Simulations are isolated and must never affect production.
      }
    }, intervalMs);
  }

  stop(): void {
    if (intervalHandle) clearInterval(intervalHandle);
    intervalHandle = undefined;
  }

  record(run: WarGameRun): void {
    reports.push(run);
    if (reports.length > 100) reports.shift();
  }

  list(): WarGameRun[] {
    return [...reports].sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const continuousSimulationScheduler = new ContinuousSimulationScheduler();
