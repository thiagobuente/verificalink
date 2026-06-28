import type { SOCAction } from "../actions/socActionEngine";
import type { IocCorrelationResult } from "../correlation/correlationEngine";
import type { Incident } from "../decision/incidentEngine";
import type { AttackIntelligence, Campaign } from "../intelligence/attackIntelligenceEngine";
import type { SOCResponse, SOCResponseType } from "../response/socResponseEngine";

export type ApprovalLevel = "none" | "analyst" | "admin";
export type OrchestrationRiskLevel = "low" | "medium" | "high" | "critical";
export type OrchestratedIncidentStatus = "open" | "investigating" | "escalated" | "resolved" | "closed";
export type PlaybookExecutionStatus = "executed" | "pending_approval" | "blocked";
export type ExecutionAdapterType = "firewall_block_request" | "SIEM_alert" | "ticket_creation" | "webhook_trigger" | "monitoring_task" | "incident_escalation";

export interface SOCPlaybook {
  id: string;
  name: string;
  triggerConditions: string[];
  actions: string[];
  requiredApprovalLevel: ApprovalLevel;
  autoExecute: boolean;
  riskLevel: OrchestrationRiskLevel;
}

export interface PlaybookExecution {
  id: string;
  incidentId: string;
  playbookId: string;
  actionType: string;
  adapterType: ExecutionAdapterType;
  status: PlaybookExecutionStatus;
  requiredApprovalLevel: ApprovalLevel;
  timestamp: number;
  simulated: true;
  message: string;
}

export interface SOCOrchestrationInput {
  incident: Incident;
  actions: SOCAction[];
  responses: SOCResponse[];
  attackIntelligence?: AttackIntelligence;
  correlation?: IocCorrelationResult;
  campaigns?: Campaign[];
}

export interface SOCOrchestrationResult {
  incidentId: string;
  playbook: SOCPlaybook;
  incidentStatus: OrchestratedIncidentStatus;
  pendingExecutions: PlaybookExecution[];
  approvedExecutions: PlaybookExecution[];
  campaignId?: string;
  correlationScore?: number;
  guardRails: string[];
  updatedAt: number;
}

export interface SOCOrchestrationSnapshot {
  activePlaybooks: SOCPlaybook[];
  pendingExecutions: PlaybookExecution[];
  approvedExecutions: PlaybookExecution[];
  incidentStatuses: Array<{ incidentId: string; status: OrchestratedIncidentStatus; updatedAt: number }>;
  campaigns: Array<{ campaignId: string; playbookId: string; incidents: string[]; updatedAt: number }>;
}

const closedAfterMs = 48 * 60 * 60 * 1000;
const activePlaybooks = new Map<string, SOCPlaybook>();
const pendingExecutionStore = new Map<string, PlaybookExecution>();
const approvedExecutionStore = new Map<string, PlaybookExecution>();
const incidentStatusStore = new Map<string, { status: OrchestratedIncidentStatus; updatedAt: number }>();
const campaignPlaybookStore = new Map<string, { campaignId: string; playbookId: string; incidents: string[]; updatedAt: number }>();
const executionLog: PlaybookExecution[] = [];

const playbooks: SOCPlaybook[] = [
  {
    id: "monitoring_playbook",
    name: "Continuous Monitoring Playbook",
    triggerConditions: ["low severity", "monitor action", "scanning activity"],
    actions: ["create ticket", "send alert"],
    requiredApprovalLevel: "none",
    autoExecute: true,
    riskLevel: "low",
  },
  {
    id: "investigation_playbook",
    name: "SOC Investigation Playbook",
    triggerConditions: ["medium severity", "investigate action", "moderate confidence"],
    actions: ["create ticket", "send alert"],
    requiredApprovalLevel: "none",
    autoExecute: true,
    riskLevel: "medium",
  },
  {
    id: "hardening_playbook",
    name: "Exposure Hardening Playbook",
    triggerConditions: ["exposure detected", "high severity", "external surface"],
    actions: ["create ticket", "send alert", "escalate incident"],
    requiredApprovalLevel: "analyst",
    autoExecute: false,
    riskLevel: "high",
  },
  {
    id: "malware_response_playbook",
    name: "Malware Response Playbook",
    triggerConditions: ["malware", "critical severity", "high confidence"],
    actions: ["create ticket", "send alert", "request block", "trigger webhook", "escalate incident"],
    requiredApprovalLevel: "admin",
    autoExecute: false,
    riskLevel: "critical",
  },
];

function stableHash(parts: string[]): string {
  let hash = 2166136261;
  const input = parts.join("|");
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function severityRank(severity: OrchestrationRiskLevel): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}


function responseApprovalLevel(response: SOCResponse): ApprovalLevel {
  if (response.responseType === "block_request" || response.responseType === "webhook") return "admin";
  if (response.requiresApproval || response.priority === "critical") return "analyst";
  return "none";
}

function actionToAdapter(response: SOCResponse): ExecutionAdapterType {
  if (response.responseType === "block_request") return "firewall_block_request";
  if (response.responseType === "alert") return "SIEM_alert";
  if (response.responseType === "ticket") return "ticket_creation";
  if (response.responseType === "webhook") return "webhook_trigger";
  return "monitoring_task";
}

function isSafeAutoAction(response: SOCResponse): boolean {
  return ["monitoring_task", "ticket", "alert"].includes(response.responseType) && !response.requiresApproval && response.priority !== "critical";
}

function playbookFor(input: SOCOrchestrationInput): SOCPlaybook {
  const attackType = input.attackIntelligence?.attackType.toLowerCase() ?? "";
  const correlationScore = input.correlation?.correlationScore ?? 0;
  const confidence = Math.max(input.incident.confidence, ...input.actions.map((action) => action.confidence), input.attackIntelligence?.confidence ?? 0);
  const hasExposure = /exposure|exposed/.test(attackType) || input.responses.some((response) => /exposure|hardening/i.test(response.rationale.join(" ")));
  const hasMalware = /malware/.test(attackType) || input.responses.some((response) => response.responseType === "block_request");
  const hasScanning = /scanning/.test(attackType);

  if (hasMalware && (confidence >= 70 || input.incident.severity === "critical")) return playbooks.find((playbook) => playbook.id === "malware_response_playbook")!;
  if (hasExposure || input.incident.severity === "high") return playbooks.find((playbook) => playbook.id === "hardening_playbook")!;
  if (hasScanning || input.actions.some((action) => action.actionType === "monitor") || correlationScore >= 70) return playbooks.find((playbook) => playbook.id === "monitoring_playbook")!;
  return playbooks.find((playbook) => playbook.id === "investigation_playbook")!;
}

function executionKey(incidentId: string, playbookId: string, actionType: string): string {
  return stableHash([incidentId, playbookId, actionType]);
}

function messageFor(response: SOCResponse, playbook: SOCPlaybook): string {
  if (response.responseType === "block_request") return "Prepared block request for admin approval under " + playbook.name;
  if (response.responseType === "webhook") return "Prepared webhook payload for approval under " + playbook.name;
  if (response.responseType === "ticket") return "Simulated ticket creation under " + playbook.name;
  if (response.responseType === "alert") return "Simulated SIEM alert under " + playbook.name;
  return "Simulated monitoring task under " + playbook.name;
}

function guardedExecution(playbook: SOCPlaybook, response: SOCResponse, incident: Incident): PlaybookExecution {
  const adapterType = actionToAdapter(response);
  const requiredApprovalLevel = responseApprovalLevel(response);
  const canAutoExecute = playbook.autoExecute && isSafeAutoAction(response) && requiredApprovalLevel === "none";
  const status: PlaybookExecutionStatus = canAutoExecute ? "executed" : "pending_approval";
  return {
    id: executionKey(incident.id, playbook.id, response.responseType),
    incidentId: incident.id,
    playbookId: playbook.id,
    actionType: response.responseType,
    adapterType,
    status,
    requiredApprovalLevel,
    timestamp: Date.now(),
    simulated: true,
    message: messageFor(response, playbook),
  };
}

function nextIncidentStatus(incident: Incident, playbook: SOCPlaybook): OrchestratedIncidentStatus {
  const existing = incidentStatusStore.get(incident.id);
  const now = Date.now();
  if (existing?.status === "resolved" && now - existing.updatedAt > closedAfterMs) return "closed";
  if (existing?.status === "closed") return "closed";
  if (playbook.riskLevel === "high" || playbook.riskLevel === "critical" || incident.severity === "high" || incident.severity === "critical") return "escalated";
  return "investigating";
}

function guardRailsFor(responses: SOCResponse[], playbook: SOCPlaybook): string[] {
  return unique([
    "No external action is executed against a real system",
    responses.some((response) => response.responseType === "block_request") ? "Block requests require admin approval" : undefined,
    responses.some((response) => response.responseType === "webhook") ? "Webhook triggers require approval" : undefined,
    playbook.autoExecute ? "Automation is limited to low-risk simulated actions" : "Playbook execution is pending approval",
  ]);
}

function relatedCampaign(input: SOCOrchestrationInput): Campaign | undefined {
  return input.campaigns?.find((campaign) => campaign.relatedIncidents.includes(input.incident.id));
}

export class SOCOrchestrator {
  orchestrate(input: SOCOrchestrationInput): SOCOrchestrationResult | undefined {
    if (!input.incident?.id || input.responses.length === 0) return undefined;
    const playbook = playbookFor(input);
    const campaign = relatedCampaign(input);
    const campaignKey = campaign ? campaign.id : undefined;

    if (campaignKey && campaign) {
      const existingCampaign = campaignPlaybookStore.get(campaignKey);
      if (!existingCampaign) {
        campaignPlaybookStore.set(campaignKey, {
          campaignId: campaignKey,
          playbookId: playbook.id,
          incidents: campaign.relatedIncidents,
          updatedAt: Date.now(),
        });
      } else {
        const strongerPlaybook = severityRank(playbook.riskLevel) > severityRank(playbooks.find((item) => item.id === existingCampaign.playbookId)?.riskLevel ?? "low") ? playbook.id : existingCampaign.playbookId;
        campaignPlaybookStore.set(campaignKey, {
          ...existingCampaign,
          playbookId: strongerPlaybook,
          incidents: unique([...existingCampaign.incidents, ...campaign.relatedIncidents]).sort(),
          updatedAt: Date.now(),
        });
      }
    }

    activePlaybooks.set(input.incident.id, playbook);
    const executions = input.responses.map((response) => guardedExecution(playbook, response, input.incident));
    for (const execution of executions) {
      const key = executionKey(execution.incidentId, execution.playbookId, execution.actionType);
      if (execution.status === "executed") approvedExecutionStore.set(key, execution);
      else pendingExecutionStore.set(key, execution);
      executionLog.push(execution);
    }

    const incidentStatus = nextIncidentStatus(input.incident, playbook);
    incidentStatusStore.set(input.incident.id, { status: incidentStatus, updatedAt: Date.now() });

    return {
      incidentId: input.incident.id,
      playbook,
      incidentStatus,
      pendingExecutions: executions.filter((execution) => execution.status === "pending_approval"),
      approvedExecutions: executions.filter((execution) => execution.status === "executed"),
      ...(campaignKey ? { campaignId: campaignKey } : {}),
      ...(input.correlation ? { correlationScore: input.correlation.correlationScore } : {}),
      guardRails: guardRailsFor(input.responses, playbook),
      updatedAt: Date.now(),
    };
  }

  getSnapshot(): SOCOrchestrationSnapshot {
    return {
      activePlaybooks: [...activePlaybooks.values()].sort((a, b) => severityRank(b.riskLevel) - severityRank(a.riskLevel)),
      pendingExecutions: [...pendingExecutionStore.values()].sort((a, b) => b.timestamp - a.timestamp),
      approvedExecutions: [...approvedExecutionStore.values()].sort((a, b) => b.timestamp - a.timestamp),
      incidentStatuses: [...incidentStatusStore.entries()].map(([incidentId, value]) => ({ incidentId, ...value })).sort((a, b) => b.updatedAt - a.updatedAt),
      campaigns: [...campaignPlaybookStore.values()].sort((a, b) => b.updatedAt - a.updatedAt),
    };
  }

  getExecutionLog(): PlaybookExecution[] {
    return [...executionLog];
  }
}

export const socOrchestrator = new SOCOrchestrator();
