import { useMemo } from "react";
import { SourceData, SourceStatus } from "@/components/ConsultedSourcesPanel";
import { SECURITY_SOURCES, SOURCE_DESCRIPTIONS } from "@/lib/securitySources";

/**
 * Interface para dados de análise do backend
 * Baseado em performComprehensiveSecurityAnalysis
 */
export interface BackendAnalysisResult {
  overallRiskScore?: number;
  threatLevel?: string;
  allSources?: {
    whois?: { riskScore?: number; details?: string[] };
    alienVault?: { riskScore?: number; details?: string[] };
    urlScan?: { riskScore?: number; details?: string[] };
    hybridAnalysis?: { riskScore?: number; details?: string[] };
    spamhaus?: { riskScore?: number; details?: string[] };
    dnsReputation?: { riskScore?: number; details?: string[] };
    openPhish?: { riskScore?: number; details?: string[] };
    phishTank?: { riskScore?: number; details?: string[] };
    ipinfo?: { riskScore?: number; details?: string[] };
    securityTrails?: { riskScore?: number; details?: string[] };
    viewDNS?: { riskScore?: number; details?: string[] };
    ipAPI?: { riskScore?: number; details?: string[] };
  };
  consolidatedDetails?: string[];
}

/**
 * Mapear dados do backend para status de fonte
 */
const mapBackendSourceToStatus = (
  sourceId: string,
  analysisData: BackendAnalysisResult
): SourceStatus => {
  if (!analysisData?.allSources) return "unchecked";

  try {
    const riskScore = analysisData.overallRiskScore || 0;
    let sourceData: any = null;

    // Mapear ID da fonte para dados do backend
    switch (sourceId) {
      case "virustotal":
        // VirusTotal não está no backend atual, usar URLScan como proxy
        sourceData = analysisData.allSources.urlScan;
        break;

      case "google_safe_browsing":
        // Google Safe Browsing não está no backend atual, usar OpenPhish como proxy
        sourceData = analysisData.allSources.openPhish;
        break;

      case "abuseipdb":
        // AbuseIPDB não está no backend atual, usar Spamhaus como proxy
        sourceData = analysisData.allSources.spamhaus;
        break;

      case "urlhaus":
        // URLhaus não está no backend atual, usar PhishTank como proxy
        sourceData = analysisData.allSources.phishTank;
        break;

      case "alienvault_otx":
        sourceData = analysisData.allSources.alienVault;
        break;

      case "urlscan":
        sourceData = analysisData.allSources.urlScan;
        break;

      case "whoisxml":
        sourceData = analysisData.allSources.whois;
        break;

      case "hybrid_analysis":
        sourceData = analysisData.allSources.hybridAnalysis;
        break;

      case "censys":
        // Censys não está no backend atual, usar SecurityTrails como proxy
        sourceData = analysisData.allSources.securityTrails;
        break;

      case "maxmind":
        sourceData = analysisData.allSources.ipinfo;
        break;

      case "project_honeypot":
        // Project Honey Pot não está no backend atual, usar Spamhaus como proxy
        sourceData = analysisData.allSources.spamhaus;
        break;

      case "phishtank":
        sourceData = analysisData.allSources.phishTank;
        break;

      case "openphish":
        sourceData = analysisData.allSources.openPhish;
        break;

      case "local_analysis":
        sourceData = analysisData.allSources.dnsReputation;
        break;

      default:
        return "unchecked";
    }

    // Se não temos dados para essa fonte, retornar "não consultado"
    if (!sourceData) return "unchecked";

    // Determinar status baseado no riskScore
    const score = sourceData.riskScore || 0;
    if (score === 0) return "clean";
    if (score < 30) return "clean";
    if (score < 60) return "suspicious";
    return "dangerous";
  } catch (error) {
    console.error(`Erro ao mapear status da fonte ${sourceId}:`, error);
    return "unavailable";
  }
};

/**
 * Contar quantas fontes foram consultadas
 */
const countConsultedSources = (analysisData: BackendAnalysisResult): number => {
  if (!analysisData?.allSources) return 0;

  const sources = [
    analysisData.allSources.whois,
    analysisData.allSources.alienVault,
    analysisData.allSources.urlScan,
    analysisData.allSources.hybridAnalysis,
    analysisData.allSources.spamhaus,
    analysisData.allSources.dnsReputation,
    analysisData.allSources.openPhish,
    analysisData.allSources.phishTank,
    analysisData.allSources.ipinfo,
    analysisData.allSources.securityTrails,
    analysisData.allSources.viewDNS,
    analysisData.allSources.ipAPI,
  ];

  return sources.filter((s) => s !== null && s !== undefined).length;
};

/**
 * Contar fontes por status
 */
const countSourcesByStatus = (
  analysisData: BackendAnalysisResult
): { clean: number; suspicious: number; dangerous: number; unchecked: number } => {
  const counts = { clean: 0, suspicious: 0, dangerous: 0, unchecked: 0 };

  if (!analysisData?.allSources) {
    counts.unchecked = 14;
    return counts;
  }

  Object.keys(SECURITY_SOURCES).forEach((sourceId) => {
    const status = mapBackendSourceToStatus(sourceId, analysisData);
    counts[status as keyof typeof counts]++;
  });

  return counts;
};

/**
 * Hook para gerar dados de fontes consultadas com dados reais do backend
 */
export const useConsultedSources = (
  analysisData?: BackendAnalysisResult
): SourceData[] => {
  return useMemo(() => {
    if (!analysisData) {
      // Retornar todas as fontes como "não consultadas"
      return Object.entries(SECURITY_SOURCES).map(([, source]) => ({
        ...source,
        status: "unchecked" as SourceStatus,
      }));
    }

    // Gerar dados de fontes com status baseado na análise real
    return Object.entries(SECURITY_SOURCES).map(([sourceId, source]) => {
      const status = mapBackendSourceToStatus(sourceId, analysisData);
      const sourceData: SourceData = {
        ...source,
        status,
        description: SOURCE_DESCRIPTIONS[sourceId],
      };

      // Adicionar detalhes específicos de cada fonte
      if (analysisData.allSources) {
        switch (sourceId) {
          case "alienvault_otx":
            if (analysisData.allSources.alienVault?.riskScore) {
              sourceData.details = `Score de risco: ${analysisData.allSources.alienVault.riskScore}/100`;
            }
            break;

          case "urlscan":
            if (analysisData.allSources.urlScan?.riskScore) {
              sourceData.details = `Score de risco: ${analysisData.allSources.urlScan.riskScore}/100`;
            }
            break;

          case "whoisxml":
            if (analysisData.allSources.whois?.riskScore) {
              sourceData.details = `Score de risco: ${analysisData.allSources.whois.riskScore}/100`;
            }
            break;

          case "hybrid_analysis":
            if (analysisData.allSources.hybridAnalysis?.riskScore) {
              sourceData.details = `Score de risco: ${analysisData.allSources.hybridAnalysis.riskScore}/100`;
            }
            break;

          case "maxmind":
            if (analysisData.allSources.ipinfo?.riskScore) {
              sourceData.details = `Score de risco: ${analysisData.allSources.ipinfo.riskScore}/100`;
            }
            break;

          case "local_analysis":
            if (analysisData.overallRiskScore) {
              sourceData.details = `Score geral: ${analysisData.overallRiskScore}/100`;
            }
            break;
        }
      }

      return sourceData;
    });
  }, [analysisData]);
};

/**
 * Hook para obter resumo de status das fontes
 */
export const useSourcesStatusSummary = (
  analysisData?: BackendAnalysisResult
): { clean: number; suspicious: number; dangerous: number; unchecked: number; total: number; consulted: number } => {
  return useMemo(() => {
    if (!analysisData) {
      return { clean: 0, suspicious: 0, dangerous: 0, unchecked: 14, total: 14, consulted: 0 };
    }

    const counts = countSourcesByStatus(analysisData);
    const consulted = countConsultedSources(analysisData);

    return {
      ...counts,
      total: 14,
      consulted,
    };
  }, [analysisData]);
};
