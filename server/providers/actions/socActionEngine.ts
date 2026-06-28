import type { IocCorrelationResult } from "../correlation/correlationEngine";
import type { Incident } from "../decision/incidentEngine";
import type { AttackIntelligence } from "../intelligence/attackIntelligenceEngine";
import type { NormalizedThreatResult } from "../interfaces/provider";

export type SOCActionType = "monitor" | "investigate" | "block" | "escalate" | "ignore";
export type SOCPriority = "low" | "medium" | "high" | "critical";

export interface SOCAction {
  actionId?: string;
  incidentId: string;
  actionType: SOCActionType;
  priority: SOCPriority;
  rationale: string[];
  suggestedSteps: string[];
  confidence: number;
}

export interface SOCActionInput {
  incident: Incident;
  correlation?: IocCorrelationResult;
  providers?: NormalizedThreatResult[];
  threatScore?: number;
  riskLevel?: string;
  explanation?: string[];
  attackIntelligence?: AttackIntelligence;
}

const actionStore = new Map<string, SOCAction>();

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function providerIds(input: SOCActionInput): Set<string> {
  return new Set((input.providers ?? []).map((provider) => provider.providerId));
}

function hasProvider(input: SOCActionInput, id: string): boolean {
  return providerIds(input).has(id);
}

function riskyProviders(input: SOCActionInput): NormalizedThreatResult[] {
  return (input.providers ?? []).filter((provider) => provider.malicious || provider.riskScore >= 35 || provider.reputation === "malicious" || provider.reputation === "suspicious");
}

function hasMultipleProviderAgreement(input: SOCActionInput): boolean {
  return new Set(riskyProviders(input).map((provider) => provider.providerId)).size >= 2;
}

function hasGreyNoiseBenign(input: SOCActionInput): boolean {
  return (input.providers ?? []).some((provider) => provider.providerId === "greynoise" && (provider.reputation === "trusted" || /benign|riot|business/i.test([...provider.tags, ...provider.categories].join(" "))));
}

function hasGreyNoiseMalicious(input: SOCActionInput): boolean {
  return (input.providers ?? []).some((provider) => provider.providerId === "greynoise" && (provider.malicious || provider.reputation === "malicious"));
}

function hasScanningActivity(input: SOCActionInput): boolean {
  return hasGreyNoiseMalicious(input) && hasProvider(input, "urlscan");
}

function hasVirusTotalMalware(input: SOCActionInput): boolean {
  return (input.providers ?? []).some((provider) => provider.providerId === "virustotal" && (provider.malicious || provider.riskScore >= 60));
}

function abuseConfidence(input: SOCActionInput): number | undefined {
  const abuse = (input.providers ?? []).find((provider) => provider.providerId === "abuseipdb");
  const raw = abuse?.raw && typeof abuse.raw === "object" ? abuse.raw as { data?: { abuseConfidenceScore?: number } } : undefined;
  return raw?.data?.abuseConfidenceScore;
}

function hasExposure(input: SOCActionInput): boolean {
  return hasProvider(input, "shodan") || hasProvider(input, "censys");
}

function hasConfirmedExposure(input: SOCActionInput): boolean {
  return hasProvider(input, "shodan") && hasProvider(input, "censys");
}

function conflictCount(input: SOCActionInput): number {
  let count = 0;
  if (hasGreyNoiseBenign(input) && riskyProviders(input).length > 0) count += 1;
  if (input.correlation?.correlationExplanation.some((message) => /conflict/i.test(message))) count += 1;
  return count;
}

function baseAction(input: SOCActionInput): SOCActionType {
  const score = input.correlation?.correlationScore ?? input.threatScore ?? input.incident.confidence;
  if (score < 30) return "ignore";
  if (score <= 50) return "monitor";
  if (score <= 70) return "investigate";
  if (score <= 85) return "escalate";
  return "escalate";
}

function blockCandidate(input: SOCActionInput): boolean {
  const score = input.correlation?.correlationScore ?? 0;
  const abuse = abuseConfidence(input) ?? 0;
  const blockSignals = [hasVirusTotalMalware(input), abuse > 80, hasScanningActivity(input), score > 85].filter(Boolean).length;
  return blockSignals >= 2 && hasMultipleProviderAgreement(input);
}

function downgrade(action: SOCActionType): SOCActionType {
  if (action === "block") return "escalate";
  if (action === "escalate") return "investigate";
  if (action === "investigate") return "monitor";
  if (action === "monitor") return "ignore";
  return "ignore";
}

function chooseAction(input: SOCActionInput): SOCActionType {
  let action = blockCandidate(input) ? "block" : baseAction(input);
  const confidence = actionConfidence(input, action);
  if (action === "block" && confidence < 70) action = "escalate";
  if ((action === "escalate" || action === "block") && (input.correlation?.correlationScore ?? 0) <= 50) action = "investigate";
  if (hasGreyNoiseBenign(input)) action = downgrade(action);
  if (conflictCount(input) >= 2) action = downgrade(action);
  return action;
}

function priorityFor(input: SOCActionInput, action: SOCActionType): SOCPriority {
  const score = input.correlation?.correlationScore ?? input.threatScore ?? input.incident.confidence;
  if (action === "block") return "critical";
  if (hasGreyNoiseBenign(input) || conflictCount(input) > 0) return score >= 50 ? "medium" : "low";
  if (hasMultipleProviderAgreement(input) && (input.incident.severity === "critical" || score >= 85)) return "critical";
  if ((hasExposure(input) && score >= 50) || action === "escalate") return "high";
  if (score >= 35 || action === "investigate") return "medium";
  return "low";
}

function rationale(input: SOCActionInput, action: SOCActionType): string[] {
  const abuse = abuseConfidence(input);
  const reasons = [
    hasMultipleProviderAgreement(input) ? "Multiple providers confirm malicious or suspicious activity" : undefined,
    hasConfirmedExposure(input) ? "Exposed service detected via Shodan and Censys" : hasExposure(input) ? "Exposed infrastructure observed by an external provider" : undefined,
    abuse !== undefined && abuse > 50 ? "High abuse confidence reported by AbuseIPDB" : undefined,
    hasVirusTotalMalware(input) ? "VirusTotal reported malware or malicious reputation" : undefined,
    hasScanningActivity(input) ? "GreyNoise and URLScan indicate active scanning behavior" : undefined,
    hasGreyNoiseBenign(input) ? "GreyNoise indicates benign scanner reducing severity" : undefined,
    action === "ignore" ? "Correlation score is low and current evidence is limited" : undefined,
  ];
  return unique(reasons).slice(0, 8);
}

function providerSteps(input: SOCActionInput): string[] {
  const steps = [
    hasProvider(input, "shodan") || hasProvider(input, "censys") ? "Verify exposed ports and services on detected host" : undefined,
    hasProvider(input, "virustotal") ? "Analyze VirusTotal detection history" : undefined,
    hasProvider(input, "alienvault-otx") ? "Check OTX pulse related to IOC" : undefined,
    hasProvider(input, "urlscan") ? "Review URLScan network requests" : undefined,
    hasProvider(input, "abuseipdb") ? "Review AbuseIPDB report history" : undefined,
    hasProvider(input, "greynoise") ? "Review GreyNoise classification and activity context" : undefined,
  ];
  return unique(steps);
}

function suggestedSteps(input: SOCActionInput, action: SOCActionType): string[] {
  const base = action === "ignore" ? ["Record the signal and continue passive observation"]
    : action === "monitor" ? ["Continue tracking IOC activity", "Log additional events"]
      : action === "investigate" ? ["Analyze related IP infrastructure", "Review related intelligence history", ...providerSteps(input)]
        : action === "escalate" ? ["Notify SOC analyst", "Correlate with other incidents", ...providerSteps(input)]
          : ["Recommend blocking IP/domain at firewall level", "Add IOC to blacklist feed", "Notify SOC analyst", ...providerSteps(input)];
  return unique(base).slice(0, 10);
}

function actionConfidence(input: SOCActionInput, action: SOCActionType): number {
  const score = input.correlation?.correlationScore ?? input.threatScore ?? input.incident.confidence;
  const multiProviderBoost = hasMultipleProviderAgreement(input) ? 12 : -10;
  const conflictPenalty = conflictCount(input) * 16;
  const actionBoost = action === "block" ? 8 : action === "escalate" ? 5 : 0;
  return clampScore(score * 0.5 + input.incident.confidence * 0.35 + (input.threatScore ?? 0) * 0.15 + multiProviderBoost + actionBoost - conflictPenalty);
}

function actionFingerprint(incidentId: string, actionType: SOCActionType, severity: SOCPriority): string {
  let hash = 2166136261;
  const input = [incidentId, actionType, severity].join("|");
  for (let index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return "action_" + (hash >>> 0).toString(16);
}

function actionKey(incidentId: string, actionType: SOCActionType, severity: SOCPriority): string {
  return actionFingerprint(incidentId, actionType, severity);
}

export class SOCActionEngine {
  createActions(input: SOCActionInput): SOCAction[] {
    const actionType = chooseAction(input);
    const action: SOCAction = {
      incidentId: input.incident.id,
      actionType,
      priority: priorityFor(input, actionType),
      rationale: rationale(input, actionType),
      suggestedSteps: suggestedSteps(input, actionType),
      confidence: actionConfidence(input, actionType),
    };
    action.actionId = actionFingerprint(action.incidentId, action.actionType, action.priority);
    const key = actionKey(action.incidentId, action.actionType, action.priority);
    for (const existingKey of [...actionStore.keys()]) {
      if (existingKey.startsWith(action.incidentId + ":") && existingKey !== key) actionStore.delete(existingKey);
    }
    actionStore.set(key, action);
    return [action];
  }

  listActions(): SOCAction[] {
    return [...actionStore.values()].sort((a, b) => b.confidence - a.confidence);
  }
}

export const socActionEngine = new SOCActionEngine();
