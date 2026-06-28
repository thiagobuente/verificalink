import type { SOCAction, SOCActionType, SOCPriority } from "../actions/socActionEngine";
import type { Incident } from "../decision/incidentEngine";
import type { AttackIntelligence } from "../intelligence/attackIntelligenceEngine";

export type SOCResponseType = "ticket" | "webhook" | "alert" | "block_request" | "monitoring_task";

export interface SOCResponse {
  incidentId: string;
  responseType: SOCResponseType;
  priority: SOCPriority;
  payload: any;
  targetSystem?: string;
  rationale: string[];
  requiresApproval: boolean;
  confidence: number;
}

export interface SOCAlert {
  incidentId: string;
  level: SOCPriority;
  message: string;
  recommendedAction: SOCActionType;
  timestamp: number;
}

export interface SOCResponseInput {
  incident: Incident;
  actions: SOCAction[];
  attackIntelligence?: AttackIntelligence;
}

interface ResponseAuditEntry {
  incidentId: string;
  responseType: SOCResponseType;
  actionType: SOCActionType;
  timestamp: number;
  requiresApproval: boolean;
}

interface GeneratedResponse {
  action: SOCAction;
  response: SOCResponse;
}

const responseStore = new Map<string, SOCResponse>();
const auditLog: ResponseAuditEntry[] = [];
const generationGuard = new Set<string>();

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function stableHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function responseKey(incidentId: string, actionType: SOCActionType, responseType: SOCResponseType): string {
  return stableHash([incidentId, actionType, responseType].join(":"));
}

function pendingStatus(priority: SOCPriority): "pending" | "ready" {
  return priority === "critical" ? "pending" : "ready";
}

function requiresApproval(responseType: SOCResponseType, action: SOCAction): boolean {
  if (responseType === "block_request") return true;
  if (responseType === "webhook") return true;
  if (action.priority === "critical") return true;
  if (action.actionType === "escalate" && action.confidence < 85) return true;
  return false;
}

function ticketPayload(incident: Incident, action: SOCAction, intelligence?: AttackIntelligence) {
  return {
    title: "[" + action.priority.toUpperCase() + "] " + incident.title,
    description: intelligence?.summary ?? action.rationale.join(". "),
    severity: action.priority,
    incidentId: incident.id,
    evidenceSummary: unique([...(intelligence?.observedBehavior ?? []), ...action.rationale]),
    recommendedSteps: action.suggestedSteps,
    relatedIOCs: incident.relatedIOCs,
    status: pendingStatus(action.priority),
    source: "shield-security",
  };
}

function monitoringPayload(incident: Incident, action: SOCAction) {
  return {
    title: "Monitor " + incident.title,
    incidentId: incident.id,
    severity: action.priority,
    relatedIOCs: incident.relatedIOCs,
    recommendedSteps: action.suggestedSteps,
    status: pendingStatus(action.priority),
    cadence: "continuous",
    source: "shield-security",
  };
}

function blockRequestPayload(incident: Incident, action: SOCAction, intelligence?: AttackIntelligence) {
  return {
    title: "Block request for " + incident.title,
    incidentId: incident.id,
    severity: action.priority,
    relatedIOCs: incident.relatedIOCs,
    recommendedSteps: action.suggestedSteps,
    evidenceSummary: unique([...(intelligence?.observedBehavior ?? []), ...action.rationale]),
    status: "pending",
    autoExecute: false,
    source: "shield-security",
  };
}

function alertPayload(incident: Incident, action: SOCAction): SOCAlert & { status: "pending" | "ready"; source: string } {
  return {
    incidentId: incident.id,
    level: action.priority,
    message: incident.title,
    recommendedAction: action.actionType,
    timestamp: Date.now(),
    status: pendingStatus(action.priority),
    source: "shield-security",
  };
}

function webhookPayload(incident: Incident, action: SOCAction) {
  return {
    incidentId: incident.id,
    severity: action.priority,
    recommendedAction: action.actionType,
    confidence: action.confidence,
    status: "pending",
    autoExecute: false,
    source: "shield-security",
  };
}

function buildResponse(
  incident: Incident,
  action: SOCAction,
  responseType: SOCResponseType,
  payload: SOCResponse["payload"],
  targetSystem?: string,
): SOCResponse {
  return {
    incidentId: incident.id,
    responseType,
    priority: action.priority,
    payload,
    targetSystem,
    rationale: action.rationale,
    requiresApproval: requiresApproval(responseType, action),
    confidence: action.confidence,
  };
}

function responsesForAction(incident: Incident, action: SOCAction, intelligence?: AttackIntelligence): GeneratedResponse[] {
  if (action.actionType === "ignore") return [];
  if (action.actionType === "monitor") {
    return [{ action, response: buildResponse(incident, action, "monitoring_task", monitoringPayload(incident, action)) }];
  }
  if (action.actionType === "investigate") {
    return [{ action, response: buildResponse(incident, action, "ticket", ticketPayload(incident, action, intelligence), "case-management") }];
  }
  if (action.actionType === "escalate") {
    return [
      { action, response: buildResponse(incident, action, "alert", alertPayload(incident, action), "soc-dashboard") },
      { action, response: buildResponse(incident, action, "ticket", ticketPayload(incident, action, intelligence), "case-management") },
      { action, response: buildResponse(incident, action, "webhook", webhookPayload(incident, action), "external-webhook") },
    ];
  }
  return [
    { action, response: buildResponse(incident, action, "block_request", blockRequestPayload(incident, action, intelligence), "network-control") },
    { action, response: buildResponse(incident, action, "webhook", webhookPayload(incident, action), "external-webhook") },
  ];
}

function logResponse(action: SOCAction, response: SOCResponse): void {
  auditLog.push({
    incidentId: response.incidentId,
    responseType: response.responseType,
    actionType: action.actionType,
    timestamp: Date.now(),
    requiresApproval: response.requiresApproval,
  });
}

export class SOCResponseEngine {
  createResponses(input: SOCResponseInput): SOCResponse[] {
    const guardKey = input.incident.id + ":" + input.actions.map((action) => action.actionType).join(",");
    if (generationGuard.has(guardKey)) return this.listResponses().filter((response) => response.incidentId === input.incident.id);
    generationGuard.add(guardKey);

    try {
      for (const key of [...responseStore.keys()]) {
        const response = responseStore.get(key);
        if (response?.incidentId === input.incident.id) responseStore.delete(key);
      }

      const generated = input.actions.flatMap((action) => responsesForAction(input.incident, action, input.attackIntelligence));
      for (const { action, response } of generated) {
        responseStore.set(responseKey(response.incidentId, action.actionType, response.responseType), response);
        logResponse(action, response);
      }
      return generated.map((item) => item.response);
    } catch (error) {
      console.error("soc_response_generation_failed", { error: error instanceof Error ? error.message : String(error) });
      return [];
    } finally {
      generationGuard.delete(guardKey);
    }
  }

  listResponses(): SOCResponse[] {
    return [...responseStore.values()].sort((a, b) => b.confidence - a.confidence);
  }

  listAuditLog(): ResponseAuditEntry[] {
    return [...auditLog];
  }
}

export const socResponseEngine = new SOCResponseEngine();
