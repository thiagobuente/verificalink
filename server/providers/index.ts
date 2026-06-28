export { iocAggregator, IocAggregator } from "./aggregator/iocAggregator";
export { getThreatIntelProviders } from "./registry";
export type { AggregatedIocResult, ProviderFailure } from "./aggregator/iocAggregator";
export type { IocType, NormalizedThreatResult, ProviderHealthSnapshot, ThreatIntelProvider } from "./interfaces/provider";

export { correlateIocResult, toSecurityEvents } from "./correlation/correlationEngine";
export type { IocCorrelationResult, SecurityEvent, SecurityTimelineEvent } from "./correlation/correlationEngine";

export { incidentEngine, IncidentEngine } from "./decision/incidentEngine";
export type { Incident, IncidentSeverity, IncidentStatus } from "./decision/incidentEngine";

export { attackIntelligenceEngine, AttackIntelligenceEngine } from "./intelligence/attackIntelligenceEngine";
export type { AttackIntelligence, Campaign } from "./intelligence/attackIntelligenceEngine";

export { attackNarrativeEngine, AttackNarrativeEngine } from "./narrative/attackNarrativeEngine";
export type { AttackNarrative, NarrativeAttackType } from "./narrative/attackNarrativeEngine";

export { socActionEngine, SOCActionEngine } from "./actions/socActionEngine";
export type { SOCAction, SOCActionType, SOCPriority } from "./actions/socActionEngine";

export { socResponseEngine, SOCResponseEngine } from "./response/socResponseEngine";
export type { SOCAlert, SOCResponse, SOCResponseType } from "./response/socResponseEngine";

export { socOrchestrator, SOCOrchestrator } from "./orchestration/socOrchestrator";
export type { ApprovalLevel, ExecutionAdapterType, OrchestratedIncidentStatus, PlaybookExecution, PlaybookExecutionStatus, SOCOrchestrationInput, SOCOrchestrationResult, SOCOrchestrationSnapshot, SOCPlaybook } from "./orchestration/socOrchestrator";

export { socAIOperator, SocAIOperator } from "./ai/socAIOperator";
export type { SocAIOperatorInput } from "./ai/socAIOperator";
export { adjustPriority, calculateHiddenRisk } from "./ai/heuristics";
export type { HiddenRiskInput } from "./ai/heuristics";
export type { SOCOperatorDecision, SOCOperatorPriority } from "./ai/types";

export { incidentStore, IncidentStore } from "./storage/incidentStore";
export type { StoredIncident } from "./storage/incidentStore";
export { incidentCache, IncidentCache } from "./storage/cache";
export { getSOCMetrics } from "./storage/metrics";
export type { SOCMetricsSnapshot } from "./storage/metrics";
export { socAuditLogger, SOCAuditLogger } from "./audit/socAuditLogger";
export type { SOCAuditEvent, SOCAuditEventType } from "./audit/socAuditLogger";
export { socTimelineBuilder, SOCTimelineBuilder } from "./timeline/socTimelineBuilder";
export type { SOCTimelineEvent } from "./timeline/socTimelineBuilder";
export { incidentReplayEngine, IncidentReplayEngine } from "./replay/incidentReplayEngine";
export type { IncidentReplayResult } from "./replay/incidentReplayEngine";

export { currentTenantId, getTenantApiKeys, getTenantContext, isRoleAllowed, requireTenantContext, resolveApiKey, runWithTenant } from "../platform/tenant/tenantContext";
export type { TenantAPIKey, TenantContextValue, TenantRole } from "../platform/tenant/tenantContext";
export { tenantMiddleware } from "../platform/tenant/tenantMiddleware";
export { tenantRateLimiter } from "../platform/rateLimit/tenantRateLimiter";
export { apiGateway } from "../platform/gateway/apiGateway";
export { getTenantFeatureFlags, setTenantFeatureFlags } from "../platform/saas/featureFlags";
export type { TenantFeatureFlags } from "../platform/saas/featureFlags";
export { getTenantPlan, getTenantUsage, provisionTenant, recordTenantUsage } from "../platform/saas/tenantProvisioning";
export type { TenantPlan, TenantRecord, TenantUsage } from "../platform/saas/tenantProvisioning";
