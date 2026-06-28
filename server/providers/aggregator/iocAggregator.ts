import { LocalProviderCache } from "../cache/localCache";
import type { IocQuery, IocType, NormalizedThreatResult, ProviderHealthSnapshot, ThreatIntelProvider } from "../interfaces/provider";
import { detectIocType, normalizeIoc, clampScore } from "../services/ioc";
import { executeWithTimeoutRetry } from "../services/retry";
import { getThreatIntelProviders } from "../registry";
import { calculateIocScoring, type IocRiskLevel } from "../scoring/iocScoringEngine";
import { correlateIocResult, type IocCorrelationResult } from "../correlation/correlationEngine";
import { incidentEngine, type Incident } from "../decision/incidentEngine";
import { attackIntelligenceEngine, type AttackIntelligence } from "../intelligence/attackIntelligenceEngine";
import { attackNarrativeEngine, type AttackNarrative } from "../narrative/attackNarrativeEngine";
import { socActionEngine, type SOCAction } from "../actions/socActionEngine";
import { socResponseEngine, type SOCResponse } from "../response/socResponseEngine";
import { socOrchestrator, type SOCOrchestrationResult } from "../orchestration/socOrchestrator";
import { socAIOperator } from "../ai/socAIOperator";
import type { SOCOperatorDecision } from "../ai/types";
import { currentTenantId } from "../../platform/tenant/tenantContext";
import { getTenantFeatureFlags } from "../../platform/saas/featureFlags";
import { recordTenantCorrelation } from "../storage/metrics";
import { threatNetwork } from "../../global/intelligence/threatNetwork";
import { defenseCoordinator } from "../../global/defense/defenseCoordinator";
import { getTenantDefensePosture } from "../../global/defense/defensePostureSync";
import { socWarGameEngine } from "../../global/simulation/socWarGameEngine";
import { incidentStore } from "../storage/incidentStore";
import { incidentCache } from "../storage/cache";
import { publishSOCEvent } from "../../command-center/socEventStream";
import { limitedResponseEngine } from "../../global/autonomous/limitedResponseEngine";
import type { AutonomousActionRecord } from "../../global/autonomous/autonomousModels";
import { safeMinimalResponse } from "../../audit/fallback/globalFallbackHandler";
import { validateSOCPipeline } from "../../audit/pipeline/socPipelineValidator";
import { registerIncident } from "../../core/incidents/incidentGlobalRegistry";
import { validateAllSOCOutputs } from "../../core/soc/socSafetyKernel";

export interface ProviderFailure {
  providerId: string;
  providerName: string;
  error: string;
}

export interface AggregatedIocResult {
  tenantId: string;
  ioc: string;
  iocType: IocType;
  riskScore: number;
  malicious: boolean;
  reputation: "malicious" | "suspicious" | "neutral" | "trusted" | "unknown";
  confidence: number;
  country?: string;
  asn?: string;
  tags: string[];
  categories: string[];
  references: string[];
  timeline: NormalizedThreatResult["timeline"];
  providers: NormalizedThreatResult[];
  failures: ProviderFailure[];
  health: ProviderHealthSnapshot[];
  queriedAt: string;
  threatScore?: number;
  riskLevel?: IocRiskLevel;
  explanation?: string[];
  correlation?: IocCorrelationResult;
  incident?: Incident;
  attackIntelligence?: AttackIntelligence;
  attackNarrative?: AttackNarrative;
  socActions?: SOCAction[];
  socResponses?: SOCResponse[];
  socOrchestration?: SOCOrchestrationResult[];
  socAIOperator?: SOCOperatorDecision;
  socAutomation?: AutonomousActionRecord[];
}

const cache = new LocalProviderCache<NormalizedThreatResult>();

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function buildCacheKey(provider: ThreatIntelProvider, query: Required<IocQuery>): string {
  return provider.id + ":" + query.type + ":" + query.value.toLowerCase();
}

function reputationFromScore(score: number): AggregatedIocResult["reputation"] {
  if (score >= 70) return "malicious";
  if (score >= 35) return "suspicious";
  if (score <= 10) return "trusted";
  return "neutral";
}

function systemFallbackProviderResult(query: Required<IocQuery>): NormalizedThreatResult {
  return { providerId: "system-fallback", providerName: "System Fallback", ioc: query.value, iocType: query.type, riskScore: 0, malicious: false, reputation: "unknown", confidence: 0, tags: [], categories: [], references: [], timeline: [], queriedAt: new Date().toISOString() };
}

function emptyProviderResult(provider: ThreatIntelProvider, query: Required<IocQuery>): NormalizedThreatResult {
  return { providerId: provider.id, providerName: provider.name, ioc: query.value, iocType: query.type, riskScore: 0, malicious: false, reputation: "unknown", confidence: 0, tags: [], categories: [], references: [], timeline: [], queriedAt: new Date().toISOString() };
}

function normalizeProviderResponse(provider: ThreatIntelProvider, query: Required<IocQuery>, output: { result?: NormalizedThreatResult; failure?: ProviderFailure } | undefined): { success: boolean; data: NormalizedThreatResult; error: string | null; failure?: ProviderFailure } {
  if (output?.result) return { success: true, data: output.result, error: null };
  const error = output?.failure?.error ?? "provider returned undefined";
  return { success: false, data: emptyProviderResult(provider, query), error, failure: output?.failure ?? { providerId: provider.id, providerName: provider.name, error } };
}

async function executeProvider(provider: ThreatIntelProvider, query: Required<IocQuery>, cacheTtlMs: number): Promise<{ result?: NormalizedThreatResult; failure?: ProviderFailure }> {
  const key = buildCacheKey(provider, query);
  const cached = cache.get(key);
  if (cached) return { result: cached };

  try {
    const { value } = await executeWithTimeoutRetry((signal) => provider.analyze(query, signal), {
      timeoutMs: provider.timeoutMs,
      retries: Number(process.env.PROVIDER_RETRY_ATTEMPTS || 2),
      retryBaseDelayMs: Number(process.env.PROVIDER_RETRY_BASE_DELAY_MS || 250),
    });
    cache.set(key, value, cacheTtlMs);
    return { result: value };
  } catch (error) {
    return {
      failure: {
        providerId: provider.id,
        providerName: provider.name,
        error: "failed: " + (error instanceof Error ? error.message : String(error)),
      },
    };
  }
}

export class IocAggregator {
  constructor(private readonly providers: ThreatIntelProvider[] = getThreatIntelProviders()) {}

  async analyze(input: IocQuery): Promise<AggregatedIocResult> {
    const tenantId = input.tenantId ?? currentTenantId();
    const featureFlags = getTenantFeatureFlags(tenantId);
    const query: Required<IocQuery> = {
      tenantId,
      value: normalizeIoc(input.value),
      type: input.type && input.type !== "unknown" ? input.type : detectIocType(input.value),
    };
    const cachedIncident = incidentCache.get(query.value, query.type, tenantId);
    if (cachedIncident) return cachedIncident;
    const cacheTtlMs = Number(process.env.PROVIDER_CACHE_TTL_MS || 15 * 60 * 1000);
    const eligible = this.providers.filter((provider) => provider.isConfigured() && provider.supportedTypes.includes(query.type));
    const settled = await Promise.allSettled(eligible.map((provider) => executeProvider(provider, query, cacheTtlMs)));
    const providerOutputs = settled.map((item, index) => item.status === "fulfilled" ? item.value : { failure: { providerId: eligible[index]?.id ?? "unknown", providerName: eligible[index]?.name ?? "Unknown", error: "failed: " + String(item.reason) } });
    const normalizedOutputs = providerOutputs.map((item, index) => normalizeProviderResponse(eligible[index], query, item));
    const results = normalizedOutputs.length > 0 ? normalizedOutputs.map((item) => item.data) : [systemFallbackProviderResult(query)];
    const failures = normalizedOutputs.map((item) => item.failure).filter(Boolean) as ProviderFailure[];
    const confidenceWeight = results.reduce((sum, result) => sum + result.confidence / 100, 0);
    const score = confidenceWeight > 0 ? clampScore(results.reduce((sum, result) => sum + result.riskScore * (result.confidence / 100), 0) / confidenceWeight) : 0;
    const confidence = results.length > 0 ? clampScore(results.reduce((sum, result) => sum + result.confidence, 0) / results.length) : 0;
    let scoring: { threatScore: number; riskLevel: IocRiskLevel; explanation: string[] } | undefined;

    try {
      scoring = results.length > 0 ? calculateIocScoring(results) : undefined;
    } catch {
      scoring = undefined;
    }

    const baseResult = {
      tenantId,
      ioc: query.value,
      iocType: query.type,
      riskScore: score,
      malicious: results.some((result) => result.malicious) || score >= 70,
      reputation: reputationFromScore(score),
      confidence,
      country: results.find((result) => result.country)?.country,
      asn: results.find((result) => result.asn)?.asn,
      tags: unique(results.flatMap((result) => result.tags)),
      categories: unique(results.flatMap((result) => result.categories)),
      references: unique(results.flatMap((result) => result.references)),
      timeline: results.flatMap((result) => result.timeline).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
      providers: results,
      failures,
      health: this.getHealth(),
      queriedAt: new Date().toISOString(),
      ...(scoring ? { threatScore: scoring.threatScore, riskLevel: scoring.riskLevel, explanation: scoring.explanation } : {}),
    };

    try {
      if (results.length === 0) return this.finalize(baseResult);
      const correlation = correlateIocResult(baseResult);
      recordTenantCorrelation(tenantId, true);
      const enrichedResult: AggregatedIocResult = { ...baseResult, correlation };
      const incident = incidentEngine.createIncident(enrichedResult);
      if (!incident) return this.finalize(enrichedResult);
      enrichedResult.incident = registerIncident(incident);

      try {
        enrichedResult.attackIntelligence = attackIntelligenceEngine.createIntelligence({
          incident,
          correlation,
          providers: results,
          threatScore: enrichedResult.threatScore,
          riskLevel: enrichedResult.riskLevel,
          explanation: enrichedResult.explanation,
        });
      } catch {
        // Optional enrichment only.
      }

      try {
        enrichedResult.attackNarrative = attackNarrativeEngine.createNarrative({
          incident,
          correlation,
          providers: results,
          threatScore: enrichedResult.threatScore,
          riskLevel: enrichedResult.riskLevel,
          explanation: enrichedResult.explanation,
        });
      } catch {
        // Optional enrichment only.
      }

      try {
        enrichedResult.socActions = socActionEngine.createActions({
          incident,
          correlation,
          providers: results,
          threatScore: enrichedResult.threatScore,
          riskLevel: enrichedResult.riskLevel,
          explanation: enrichedResult.explanation,
          attackIntelligence: enrichedResult.attackIntelligence,
        });
      } catch {
        // Optional enrichment only.
      }

      try {
        if (enrichedResult.socActions?.length) {
          enrichedResult.socResponses = socResponseEngine.createResponses({
            incident,
            actions: enrichedResult.socActions,
            attackIntelligence: enrichedResult.attackIntelligence,
          });
        }
      } catch {
        // Optional enrichment only.
      }

      try {
        if (featureFlags.orchestration && enrichedResult.socActions?.length && enrichedResult.socResponses?.length) {
          const orchestration = socOrchestrator.orchestrate({
            incident,
            actions: enrichedResult.socActions,
            responses: enrichedResult.socResponses,
            attackIntelligence: enrichedResult.attackIntelligence,
            correlation,
            campaigns: attackIntelligenceEngine.listCampaigns(),
          });
          if (orchestration) enrichedResult.socOrchestration = [orchestration];
        }
      } catch {
        // Optional enrichment only.
      }

      try {
        if (enrichedResult.socActions?.length) {
          enrichedResult.socAutomation = enrichedResult.socActions.map((action) => limitedResponseEngine.evaluate({
            incidentId: incident.id,
            actionType: action.actionType,
            confidence: action.confidence,
            rationale: action.rationale,
          }));
        }
      } catch {
        // Optional automation only.
      }

      try {
        const defenseFeed = defenseCoordinator.buildFeed();
        const simulationSnapshot = socWarGameEngine.snapshot(tenantId);
        if (featureFlags.aiOperator) enrichedResult.socAIOperator = socAIOperator.execute({
          incident,
          correlation,
          attackIntelligence: enrichedResult.attackIntelligence,
          narrative: enrichedResult.attackNarrative,
          actions: enrichedResult.socActions,
          globalCampaigns: threatNetwork.getFeed().campaigns,
          sharedThreatSignals: threatNetwork.listSignals(),
          defenseRecommendations: defenseFeed.defenseRecommendations,
          defensePosture: getTenantDefensePosture(tenantId),
          earlyWarnings: defenseFeed.earlyWarnings,
          simulationResults: simulationSnapshot.recentSimulations,
          resilienceScore: simulationSnapshot.resilienceScore,
          detectedGaps: simulationSnapshot.gapsDetected,
        });
      } catch {
        // Optional interpretation only.
      }

      validateSOCPipeline(enrichedResult);
      return this.finalize(enrichedResult);
    } catch (error) {
      return this.finalize({ ...baseResult, ...(safeMinimalResponse(error, tenantId) as object) } as AggregatedIocResult);
    }
  }

  private finalize(result: AggregatedIocResult): AggregatedIocResult {
    try {
      publishSOCEvent({
        eventId: [result.tenantId, result.ioc, result.queriedAt].join(":"),
        tenantId: result.tenantId,
        type: result.incident ? "incident_created" : "ioc_detected",
        timestamp: Date.now(),
        severity: result.riskLevel ?? result.reputation,
        summary: result.incident?.title ?? "IOC analyzed",
        payload: {
          ioc: result.ioc,
          iocType: result.iocType,
          riskScore: result.riskScore,
          threatScore: result.threatScore,
          correlationScore: result.correlation?.correlationScore,
          adjustedPriority: result.socAIOperator?.adjustedPriority,
        },
      });
      incidentCache.set(result);
      incidentStore.persistResult(result);
    } catch {
      // Storage is optional and must never block analysis.
    }
    return validateAllSOCOutputs(result as unknown as Record<string, unknown>) as unknown as AggregatedIocResult;
  }

  getHealth(): ProviderHealthSnapshot[] {
    return this.providers.map((provider) => provider.getHealth());
  }
}

export const iocAggregator = new IocAggregator();
