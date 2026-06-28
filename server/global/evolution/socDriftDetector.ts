import type { WarGameRun } from "../simulation/simulationModels";
import type { SOCDriftStatus } from "./evolutionModels";

const driftHistory: Array<{ timestamp: number; score: number }> = [];

export function detectSOCDrift(runs: WarGameRun[]): SOCDriftStatus {
  const recent = runs.slice(0, 5);
  const reasons: string[] = [];
  const avgDetection = recent.length ? recent.reduce((sum, run) => sum + run.resilienceScore.detectionRate, 0) / recent.length : 100;
  const avgFalsePositive = recent.length ? recent.reduce((sum, run) => sum + run.resilienceScore.falsePositiveResistance, 0) / recent.length : 100;
  if (avgDetection < 55) reasons.push("Detection rate degraded in recent simulations");
  if (avgFalsePositive < 55) reasons.push("False positive resistance degraded");
  const driftScore = Math.max(0, Math.min(100, Math.round((100 - avgDetection) * 0.6 + (100 - avgFalsePositive) * 0.4)));
  driftHistory.push({ timestamp: Date.now(), score: driftScore });
  if (driftHistory.length > 10) driftHistory.shift();
  const lastThree = driftHistory.slice(-3);
  const unstable = lastThree.length === 3 && Math.max(...lastThree.map((item) => item.score)) - Math.min(...lastThree.map((item) => item.score)) > 20;
  if (unstable) reasons.push("Drift score unstable across last three cycles");
  const driftDetected = driftScore >= 45;
  const mode = unstable ? "unstable" : driftDetected ? "recovery_mode" : "stable";
  return { driftDetected, driftScore, reasons, mode, autoAdjustBlocked: unstable || mode === "recovery_mode" };
}
