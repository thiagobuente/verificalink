export type SOCPipelineStage = "ioc" | "scoring" | "correlation" | "incident" | "intelligence" | "narrative" | "actions" | "evolution" | "command_center";

export interface SOCDecisionResult {
  valid: boolean;
  status: "ok" | "degraded";
  errors: string[];
  warnings: string[];
  suggestedRepair: string[];
}

export interface SOCFallbackEnvelope<T = unknown> {
  status: "degraded";
  data: T;
  error: string;
}

const pipelineOrder: SOCPipelineStage[] = ["ioc", "scoring", "correlation", "incident", "intelligence", "narrative", "actions", "evolution", "command_center"];
const stageDependencies: Record<SOCPipelineStage, SOCPipelineStage[]> = {
  ioc: [],
  scoring: ["ioc"],
  correlation: ["scoring"],
  incident: ["correlation"],
  intelligence: ["incident"],
  narrative: ["intelligence"],
  actions: ["narrative"],
  evolution: ["actions"],
  command_center: ["evolution"],
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function validatePipelineOrder(stages: SOCPipelineStage[]): SOCDecisionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestedRepair: string[] = [];
  const seen = new Set<SOCPipelineStage>();
  for (const stage of stages) {
    for (const dependency of stageDependencies[stage]) {
      if (!seen.has(dependency)) {
        errors.push("stageInvalid:" + stage + " missing dependency " + dependency);
        suggestedRepair.push("Execute " + dependency + " before " + stage);
      }
    }
    seen.add(stage);
  }
  const indexes = stages.map((stage) => pipelineOrder.indexOf(stage));
  if (indexes.some((index, position) => position > 0 && index < indexes[position - 1])) {
    errors.push("stageInvalid:pipeline order violation");
    suggestedRepair.push("Reorder pipeline as " + pipelineOrder.join(" -> "));
  }
  for (const expected of pipelineOrder) if (!seen.has(expected)) warnings.push("stageSkipped:" + expected);
  return { valid: errors.length === 0, status: errors.length ? "degraded" : "ok", errors, warnings, suggestedRepair };
}

export function approveNormalization(payload: unknown): SOCDecisionResult {
  const errors: string[] = [];
  if (!payload || typeof payload !== "object") errors.push("normalization payload must be object");
  const record = payload as Record<string, unknown>;
  if ("providers" in record && !Array.isArray(record.providers)) errors.push("providers must be array");
  if ("failures" in record && !Array.isArray(record.failures)) errors.push("failures must be array");
  return { valid: errors.length === 0, status: errors.length ? "degraded" : "ok", errors, warnings: [], suggestedRepair: errors.map((error) => "Normalize field: " + error) };
}

export function buildSafeMinimalResponse(error: unknown, tenantId = "unknown") {
  return {
    tenantId,
    ioc: "unknown",
    iocType: "unknown",
    riskScore: 0,
    malicious: false,
    reputation: "unknown",
    confidence: 0,
    tags: [],
    categories: [],
    references: [],
    timeline: [],
    providers: [],
    failures: [{ providerId: "system", providerName: "System", error: errorMessage(error) }],
    health: [],
    queriedAt: new Date().toISOString(),
  };
}

export function fallbackDecision(error: unknown, tenantId = "unknown"): SOCFallbackEnvelope {
  return { status: "degraded", data: buildSafeMinimalResponse(error, tenantId), error: errorMessage(error) };
}

export function validatePipelineResult(result: unknown): SOCDecisionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const record = result as Record<string, unknown> | undefined;
  if (!record?.ioc) errors.push("ioc missing");
  if (record?.riskScore === undefined) errors.push("scoring missing");
  if (Array.isArray(record?.providers) && record.providers.length > 0 && !record.correlation) warnings.push("stageSkipped:correlation");
  if (record?.correlation && !record.incident) warnings.push("stageSkipped:incident");
  const normalization = approveNormalization(result);
  return {
    valid: errors.length === 0 && normalization.valid,
    status: errors.length || !normalization.valid ? "degraded" : "ok",
    errors: [...errors, ...normalization.errors],
    warnings: [...warnings, ...normalization.warnings],
    suggestedRepair: [...errors.map((error) => "Provide " + error), ...normalization.suggestedRepair],
  };
}
