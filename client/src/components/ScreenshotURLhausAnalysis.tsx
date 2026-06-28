import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Link as LinkIcon, Eye } from 'lucide-react';

export interface ScreenshotURLAnalysisData {
  totalURLsFound: number;
  maliciousURLs: number;
  suspiciousURLs: number;
  cleanURLs: number;
  unknownURLs: number;
  urls: Array<{
    url: string;
    analysis: {
      isMalicious: boolean;
      threat: string | null;
      tags: string[];
      dateAdded: string | null;
      status: string;
      reference: string | null;
    };
    confidence: number;
  }>;
  ocrText: string;
}

interface ScreenshotURLhausAnalysisProps {
  data: ScreenshotURLAnalysisData;
  isLoading: boolean;
}

const getURLStatusIcon = (status: string) => {
  switch (status) {
    case 'malicious':
      return <XCircle className="w-5 h-5 text-red-400" />;
    case 'offline':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'clean':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
  }
};

const getURLStatusLabel = (status: string): string => {
  switch (status) {
    case 'malicious':
      return 'Malicioso';
    case 'offline':
      return 'Suspeito (Offline)';
    case 'clean':
      return 'Limpo';
    default:
      return 'Desconhecido';
  }
};

const getURLStatusColor = (status: string): string => {
  switch (status) {
    case 'malicious':
      return 'from-red-900/20 to-red-800/20 border-red-500/30';
    case 'offline':
      return 'from-yellow-900/20 to-yellow-800/20 border-yellow-500/30';
    case 'clean':
      return 'from-green-900/20 to-green-800/20 border-green-500/30';
    default:
      return 'from-gray-900/20 to-gray-800/20 border-gray-500/30';
  }
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return 'text-green-400';
  if (confidence >= 70) return 'text-yellow-400';
  return 'text-orange-400';
};

export function ScreenshotURLhausAnalysis({ data, isLoading }: ScreenshotURLhausAnalysisProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-500/20 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-700/40 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-700/40 rounded w-1/2"></div>
      </div>
    );
  }

  if (data.totalURLsFound === 0) {
    return (
      <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Análise de URLs em Screenshot</h3>
            <p className="text-sm text-green-400">✓ Nenhuma URL encontrada na captura de tela</p>
          </div>
        </div>
      </div>
    );
  }

  const riskLevel =
    data.maliciousURLs > 0 ? 'critical' : data.suspiciousURLs > 0 ? 'high' : 'medium';

  const riskColors = {
    critical: 'from-red-900/20 to-red-800/20 border-red-500/30',
    high: 'from-orange-900/20 to-orange-800/20 border-orange-500/30',
    medium: 'from-yellow-900/20 to-yellow-800/20 border-yellow-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${riskColors[riskLevel]} border rounded-lg p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Análise de URLs em Screenshot</h3>
            <p className="text-sm text-gray-400">
              {data.totalURLsFound} URL{data.totalURLsFound !== 1 ? 's' : ''} encontrada{data.totalURLsFound !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.maliciousURLs > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{data.maliciousURLs}</p>
            <p className="text-xs text-red-300">Maliciosa{data.maliciousURLs !== 1 ? 's' : ''}</p>
          </div>
        )}
        {data.suspiciousURLs > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{data.suspiciousURLs}</p>
            <p className="text-xs text-yellow-300">Suspeita{data.suspiciousURLs !== 1 ? 's' : ''}</p>
          </div>
        )}
        {data.cleanURLs > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{data.cleanURLs}</p>
            <p className="text-xs text-green-300">Limpa{data.cleanURLs !== 1 ? 's' : ''}</p>
          </div>
        )}
        {data.unknownURLs > 0 && (
          <div className="bg-gray-500/10 border border-gray-500/20 rounded p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{data.unknownURLs}</p>
            <p className="text-xs text-gray-300">Desconhecida{data.unknownURLs !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* URL List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-300">URLs Detectadas:</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.urls.map((urlItem, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${getURLStatusColor(
                urlItem.analysis.status
              )} border rounded p-3 space-y-2`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {getURLStatusIcon(urlItem.analysis.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-300 break-all truncate">
                      {urlItem.url}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400">
                        {getURLStatusLabel(urlItem.analysis.status)}
                      </p>
                      <span className={`text-xs font-semibold ${getConfidenceColor(urlItem.confidence)}`}>
                        Confiança: {urlItem.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threat Info */}
              {urlItem.analysis.threat && (
                <p className="text-xs text-orange-300 ml-7">
                  Ameaça: {urlItem.analysis.threat}
                </p>
              )}

              {/* Tags */}
              {urlItem.analysis.tags && urlItem.analysis.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-7">
                  {urlItem.analysis.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Reference Link */}
              {urlItem.analysis.reference && (
                <a
                  href={`https://urlhaus.abuse.ch/browse/url/${urlItem.analysis.reference}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-cyan-400 hover:text-cyan-300 underline ml-7"
                >
                  Ver no URLhaus →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      {data.maliciousURLs > 0 && (
        <div className="bg-red-500/20 border border-red-500/40 rounded p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">
            ⚠️ Esta captura de tela contém URLs maliciosas. Não clique em links suspeitos!
          </p>
        </div>
      )}
    </div>
  );
}
