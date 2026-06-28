import { validatePerformance } from "../performance/performanceGuard";
import { validateSOCPipeline } from "../pipeline/socPipelineValidator";
import { fallbackDecision } from "../../core/soc/socDecisionKernel";

export function runSOCStabilizer(sample?: unknown) {
  const pipeline = validateSOCPipeline(sample ?? { ioc: "sample", riskScore: 0, providers: [] });
  const performance = validatePerformance({ responseTimeMs: 0, providerCalls: 0, correlationItems: 0 });
  const healthy = pipeline.valid && performance.valid;
  return { healthy, pipeline, performance, fallback: healthy ? undefined : fallbackDecision("SOC stabilizer detected degraded state"), timestamp: Date.now() };
}
