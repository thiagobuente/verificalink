/**
 * PDF URLhaus Analysis Component
 * Displays URLs found in PDF documents with threat analysis
 */

import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface URLAnalysis {
  isMalicious: boolean;
  threat: string | null;
  tags: string[];
  dateAdded: string | null;
  status: 'malicious' | 'offline' | 'clean' | 'error' | 'unknown';
  reference: string | null;
}

interface PDFURLResult {
  url: string;
  analysis: URLAnalysis;
  confidence: number;
  pageNumber?: number;
}

interface PDFURLAnalysisResult {
  totalURLsFound: number;
  maliciousURLs: number;
  suspiciousURLs: number;
  cleanURLs: number;
  unknownURLs: number;
  urls: PDFURLResult[];
  totalPages: number;
}

interface PDFURLhausAnalysisProps {
  data: PDFURLAnalysisResult;
  isLoading?: boolean;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'malicious':
      return 'bg-red-500/10 border-red-500/30 text-red-400';
    case 'offline':
      return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
    case 'clean':
      return 'bg-green-500/10 border-green-500/30 text-green-400';
    case 'error':
      return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    default:
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'malicious':
      return <AlertTriangle className="w-4 h-4" />;
    case 'offline':
      return <AlertCircle className="w-4 h-4" />;
    case 'clean':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <LinkIcon className="w-4 h-4" />;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'malicious':
      return 'Maliciosa';
    case 'offline':
      return 'Offline/Suspeita';
    case 'clean':
      return 'Limpa';
    case 'error':
      return 'Erro na Análise';
    default:
      return 'Desconhecida';
  }
};

const getThreatTags = (tags: string[]): string => {
  if (!tags || tags.length === 0) return '-';
  return tags.join(', ');
};

export const PDFURLhausAnalysis: React.FC<PDFURLhausAnalysisProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-slate-700/50 rounded-lg"></div>
        <div className="h-40 bg-slate-700/50 rounded-lg"></div>
      </div>
    );
  }

  if (!data || data.totalURLsFound === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 text-center">
        <LinkIcon className="w-8 h-8 mx-auto mb-3 text-slate-500" />
        <p className="text-slate-400">Nenhuma URL encontrada no documento PDF</p>
      </div>
    );
  }

  const riskLevel =
    data.maliciousURLs > 0
      ? 'critical'
      : data.suspiciousURLs > 0
        ? 'high'
        : data.unknownURLs > 0
          ? 'medium'
          : 'low';

  const riskColors = {
    critical: 'from-red-600/20 to-red-900/20 border-red-500/30',
    high: 'from-orange-600/20 to-orange-900/20 border-orange-500/30',
    medium: 'from-yellow-600/20 to-yellow-900/20 border-yellow-500/30',
    low: 'from-green-600/20 to-green-900/20 border-green-500/30',
  };

  const riskIcons = {
    critical: <AlertTriangle className="w-5 h-5 text-red-400" />,
    high: <AlertCircle className="w-5 h-5 text-orange-400" />,
    medium: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    low: <CheckCircle className="w-5 h-5 text-green-400" />,
  };

  const riskLabels = {
    critical: 'CRÍTICO',
    high: 'ALTO',
    medium: 'MÉDIO',
    low: 'BAIXO',
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div
        className={`bg-gradient-to-br ${riskColors[riskLevel]} border rounded-lg p-6 backdrop-blur-sm`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {riskIcons[riskLevel]}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Análise de URLs em PDF</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total de URLs</p>
                  <p className="text-xl font-bold text-cyan-400">{data.totalURLsFound}</p>
                </div>
                {data.maliciousURLs > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Maliciosas</p>
                    <p className="text-xl font-bold text-red-400">{data.maliciousURLs}</p>
                  </div>
                )}
                {data.suspiciousURLs > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Suspeitas</p>
                    <p className="text-xl font-bold text-orange-400">{data.suspiciousURLs}</p>
                  </div>
                )}
                {data.cleanURLs > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Limpas</p>
                    <p className="text-xl font-bold text-green-400">{data.cleanURLs}</p>
                  </div>
                )}
                {data.unknownURLs > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Desconhecidas</p>
                    <p className="text-xl font-bold text-yellow-400">{data.unknownURLs}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Nível de Risco</p>
            <p className="text-2xl font-bold text-white">{riskLabels[riskLevel]}</p>
          </div>
        </div>
      </div>

      {/* URLs List */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          URLs Detectadas ({data.urls.length})
        </h4>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.urls.map((urlResult, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 backdrop-blur-sm transition-all hover:shadow-lg ${getStatusColor(
                urlResult.analysis.status
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getStatusIcon(urlResult.analysis.status)}</div>

                <div className="flex-1 min-w-0">
                  {/* URL */}
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-mono break-all text-slate-200">{urlResult.url}</p>
                    {urlResult.analysis.reference && (
                      <a
                        href={urlResult.analysis.reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                        title="Ver no URLhaus"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-white/10">
                      {getStatusLabel(urlResult.analysis.status)}
                    </span>
                    {urlResult.confidence && (
                      <span className="text-xs text-slate-400">
                        Confiança: {urlResult.confidence}%
                      </span>
                    )}
                  </div>

                  {/* Threat Info */}
                  {urlResult.analysis.threat && (
                    <p className="text-xs text-slate-300 mb-1">
                      <span className="font-semibold">Ameaça:</span> {urlResult.analysis.threat}
                    </p>
                  )}

                  {/* Tags */}
                  {urlResult.analysis.tags && urlResult.analysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {urlResult.analysis.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-block px-2 py-0.5 text-xs rounded-full bg-white/5 text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Date Added */}
                  {urlResult.analysis.dateAdded && (
                    <p className="text-xs text-slate-500 mt-2">
                      Adicionado em: {new Date(urlResult.analysis.dateAdded).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Recomendações</h4>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          {data.maliciousURLs > 0 && (
            <li>⛔ NÃO clique em URLs maliciosas. Reporte o documento aos administradores.</li>
          )}
          {data.suspiciousURLs > 0 && (
            <li>⚠️ Tenha cautela com URLs suspeitas. Verifique a autenticidade antes de acessar.</li>
          )}
          {data.unknownURLs > 0 && (
            <li>❓ URLs desconhecidas podem ser legítimas. Procure por sinais de phishing.</li>
          )}
          {data.cleanURLs > 0 && (
            <li>✅ URLs limpas foram validadas como seguras. Você pode acessá-las com confiança.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PDFURLhausAnalysis;
