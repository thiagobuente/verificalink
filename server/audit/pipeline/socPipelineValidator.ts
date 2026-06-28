import { validatePipelineOrder, validatePipelineResult, type SOCPipelineStage } from "../../core/soc/socDecisionKernel";

const executedStages: SOCPipelineStage[] = [];
const pipelineLog: Array<{ event: "stageExecuted" | "stageSkipped" | "stageInvalid"; stage: string; timestamp: number; message?: string }> = [];

export function recordPipelineStage(stage: SOCPipelineStage): void {
  executedStages.push(stage);
  pipelineLog.push({ event: "stageExecuted", stage, timestamp: Date.now() });
}

export function validateSOCPipeline(result: unknown, stages: SOCPipelineStage[] = executedStages) {
  const shape = validatePipelineResult(result);
  const order = validatePipelineOrder(stages.length ? stages : ["ioc", "scoring"]);
  for (const warning of [...shape.warnings, ...order.warnings]) pipelineLog.push({ event: "stageSkipped", stage: warning, timestamp: Date.now(), message: warning });
  for (const error of [...shape.errors, ...order.errors]) pipelineLog.push({ event: "stageInvalid", stage: error, timestamp: Date.now(), message: error });
  return {
    valid: shape.valid && order.valid,
    errors: [...shape.errors, ...order.errors],
    warnings: [...shape.warnings, ...order.warnings],
    suggestedRepair: [...shape.suggestedRepair, ...order.suggestedRepair],
    log: [...pipelineLog].slice(-100),
  };
}
