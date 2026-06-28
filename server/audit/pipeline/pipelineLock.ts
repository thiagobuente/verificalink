import { validatePipelineOrder, type SOCPipelineStage } from "../../core/soc/socDecisionKernel";

export type PipelineStage = SOCPipelineStage;

export function validatePipelineLock(stages: PipelineStage[]) {
  return validatePipelineOrder(stages);
}

export const validatePipelineOrderLock = validatePipelineLock;
