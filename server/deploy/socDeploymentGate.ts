import { runSOCStabilizer } from "../audit/system/socStabilizer";
import { calculateSOCHealthScore } from "../health/socHealthScoreEngine";

export function validateSOCDeploymentGate() {
  const stabilizer = runSOCStabilizer();
  const healthScore = calculateSOCHealthScore({ driftStable: stabilizer.healthy, automationSafe: true, incidentAccuracy: 80 });
  return { allowed: stabilizer.healthy && healthScore >= 70, healthScore, stabilizer };
}
