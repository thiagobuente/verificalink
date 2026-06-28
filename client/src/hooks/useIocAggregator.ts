import { useEffect, useState } from "react";
import type { IocCorrelationResult, IocRelationship, IocTimelineEvent, IocType, Severity } from "@/domain/ioc/types";

type ProviderIocType = IocType | "unknown";

interface AggregatedProviderResult {
  providerId: string;
  providerName: string;
  ioc: string;
  iocType: ProviderIocType;
  riskScore: number;
  malicious: boolean;
  reputation: string;
  confidence: number;
  tags: string[];
  categories: string[];
  references: string[];
  timeline: Array<{ timestamp: string; title: string; description?: string; source: string }>;
}

interface AggregatedIocResponse {
  ioc: string;
  iocType: ProviderIocType;
  riskScore: number;
  malicious: boolean;
  confidence: number;
  tags: string[];
  categories: string[];
  references: string[];
  providers: AggregatedProviderResult[];
  timeline: AggregatedProviderResult["timeline"];
}

interface ApiResponse {
  success: boolean;
  data?: AggregatedIocResponse;
}

function severityFromScore(score: number): Severity {
  if (score >= 75) return "danger";
  if (score >= 40) return "warning";
  return "safe";
}

function normalizeType(type: ProviderIocType, fallback: IocType): IocType {
  return type === "unknown" ? fallback : type;
}

function mapAggregation(data: AggregatedIocResponse, fallback: IocCorrelationResult): IocCorrelationResult {
  const type = normalizeType(data.iocType, fallback.type);
  const relationships: IocRelationship[] = data.providers.map((provider) => ({
    id: provider.providerId,
    type: normalizeType(provider.iocType, type),
    value: provider.ioc,
    relation: provider.reputation,
    confidence: provider.confidence,
    source: provider.providerName,
  }));
  const timeline: IocTimelineEvent[] = data.timeline.map((event, index) => ({
    id: "provider-" + String(index),
    timestamp: event.timestamp,
    title: event.title,
    detail: event.description ?? "Evento normalizado pelo agregador de providers.",
    source: event.source,
    severity: severityFromScore(data.riskScore),
  }));

  return {
    query: data.ioc,
    type,
    riskScore: data.riskScore,
    severity: severityFromScore(data.riskScore),
    sources: data.providers.map((provider) => provider.providerName),
    relationships: relationships.length > 0 ? relationships : fallback.relationships,
    relatedIndicators: [...new Set([...data.tags, ...data.categories, ...data.references])],
    timeline: timeline.length > 0 ? timeline : fallback.timeline,
  };
}

export function useIocAggregator(ioc: string, fallback: IocCorrelationResult): IocCorrelationResult {
  const [result, setResult] = useState<IocCorrelationResult | null>(null);

  useEffect(() => {
    let active = true;
    setResult(null);

    async function aggregate() {
      if (!ioc) return;
      try {
        const response = await fetch("/api/ioc/aggregate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ioc }),
        });
        if (!response.ok) throw new Error("IOC aggregation failed");
        const payload = (await response.json()) as ApiResponse;
        if (active && payload.success && payload.data && payload.data.providers.length > 0) {
          setResult(mapAggregation(payload.data, fallback));
        }
      } catch {
        if (active) setResult(null);
      }
    }

    void aggregate();
    return () => {
      active = false;
    };
  }, [ioc, fallback]);

  return result ?? fallback;
}
