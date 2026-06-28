import { approveNormalization } from "./socDecisionKernel";

export function validateAllSOCOutputs<T extends Record<string, unknown>>(input: T): T & { safetyStatus: "ok" | "degraded"; safetyErrors: string[] } {
  const normalized = {
    ...input,
    providers: Array.isArray(input.providers) ? input.providers : [],
    failures: Array.isArray(input.failures) ? input.failures : [],
    tags: Array.isArray(input.tags) ? input.tags : [],
    categories: Array.isArray(input.categories) ? input.categories : [],
    references: Array.isArray(input.references) ? input.references : [],
    timeline: Array.isArray(input.timeline) ? input.timeline : [],
  };
  const approval = approveNormalization(normalized);
  return { ...normalized, safetyStatus: approval.status, safetyErrors: approval.errors };
}
