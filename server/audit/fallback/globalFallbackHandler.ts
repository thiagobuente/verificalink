import { fallbackDecision } from "../../core/soc/socDecisionKernel";

export function safeMinimalResponse(error: unknown, tenantId = "unknown") {
  return fallbackDecision(error, tenantId).data;
}

export function globalFallback<T = unknown>(error: unknown, tenantId = "unknown") {
  return fallbackDecision(error, tenantId) as { status: "degraded"; data: T; error: string };
}
