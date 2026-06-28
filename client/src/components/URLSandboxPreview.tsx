/**
 * URL Sandbox Preview Component
 * Exibe screenshot de URL capturada via URLScan
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface URLSandboxPreviewProps {
  url: string;
  onLoadingChange?: (loading: boolean) => void;
}

export const URLSandboxPreview: React.FC<URLSandboxPreviewProps> = ({ url, onLoadingChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sandboxData, setSandboxData] = useState<any>(null);

  // Usar tRPC para buscar screenshot
  const { data, isLoading: isFetching, error: fetchError } = trpc.sandbox.getScreenshot.useQuery(
    { url },
    { enabled: isExpanded && !screenshotUrl } // Apenas buscar quando expandir
  );

  useEffect(() => {
    if (data?.success && data?.data) {
      setScreenshotUrl(data.data.screenshotUrl || null);
      setSandboxData(data.data);
      setError(null);
    } else if (data && !data.success) {
      setError(data.error || 'Erro ao capturar screenshot');
    }
  }, [data]);

  useEffect(() => {
    if (fetchError) {
      setError('Erro ao conectar com URLScan');
    }
  }, [fetchError]);

  useEffect(() => {
    setIsLoading(isFetching);
    onLoadingChange?.(isFetching);
  }, [isFetching, onLoadingChange]);

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 70) return 'bg-red-600 text-white';
    if (riskScore >= 40) return 'bg-orange-600 text-white';
    if (riskScore >= 20) return 'bg-yellow-600 text-white';
    return 'bg-green-600 text-white';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 70) return '🚨 Alto Risco';
    if (riskScore >= 40) return '⚠️ Risco Moderado';
    if (riskScore >= 20) return '⚡ Baixo Risco';
    return '✅ Seguro';
  };

  return (
    <div className="w-full space-y-3">
      {/* Header com botão de expandir */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/50 rounded-lg hover:border-cyan-500 transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyan-300">🖼️ Sandbox de URL</p>
              <p className="text-xs text-cyan-400/70">Visualize como o site aparece</p>
            </div>
          </div>
          <div className="text-cyan-400">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="space-y-3 p-4 bg-slate-800/50 border border-cyan-500/30 rounded-lg">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-cyan-300">Capturando screenshot...</span>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Erro ao capturar</p>
                <p className="text-xs text-red-300/70">{error}</p>
              </div>
            </div>
          )}

          {/* Screenshot preview */}
          {screenshotUrl && sandboxData && !isLoading && (
            <div className="space-y-3">
              {/* Risk score badge */}
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-lg font-semibold text-sm ${getRiskBadgeColor(sandboxData.riskScore)}`}>
                  {getRiskLabel(sandboxData.riskScore)} ({sandboxData.riskScore}/100)
                </div>
              </div>

              {/* Screenshot image */}
              <div className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-black">
                <img
                  src={screenshotUrl}
                  alt="URL Screenshot"
                  className="w-full h-auto object-contain max-h-96"
                  onError={(e) => {
                    setError('Não foi possível carregar a imagem');
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Verdicts */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded text-center text-xs font-semibold ${sandboxData.verdicts.malware ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                  {sandboxData.verdicts.malware ? '🚨 Malware' : '✅ Sem Malware'}
                </div>
                <div className={`p-2 rounded text-center text-xs font-semibold ${sandboxData.verdicts.phishing ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                  {sandboxData.verdicts.phishing ? '🚨 Phishing' : '✅ Sem Phishing'}
                </div>
                <div className={`p-2 rounded text-center text-xs font-semibold ${sandboxData.verdicts.suspicious ? 'bg-orange-900/30 text-orange-300' : 'bg-green-900/30 text-green-300'}`}>
                  {sandboxData.verdicts.suspicious ? '⚠️ Suspeito' : '✅ Normal'}
                </div>
              </div>

              {/* Technologies */}
              {sandboxData.technologies && sandboxData.technologies.length > 0 && (
                <div>
                  <p className="text-xs text-cyan-300 mb-2 font-semibold">Tecnologias Detectadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {sandboxData.technologies.slice(0, 8).map((tech: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded border border-cyan-500/30">
                        {tech}
                      </span>
                    ))}
                    {sandboxData.technologies.length > 8 && (
                      <span className="px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded border border-cyan-500/30">
                        +{sandboxData.technologies.length - 8} mais
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Details */}
              {sandboxData.details && sandboxData.details.length > 0 && (
                <div>
                  <p className="text-xs text-cyan-300 mb-2 font-semibold">Detalhes:</p>
                  <ul className="space-y-1">
                    {sandboxData.details.map((detail: string, idx: number) => (
                      <li key={idx} className="text-xs text-cyan-300/70">
                        • {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Redirects warning */}
              {sandboxData.hasRedirects && (
                <div className="p-2 bg-orange-900/20 border border-orange-500/50 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-300">Website possui redirecionamentos suspeitos</p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                ℹ️ Screenshot capturado via URLScan.io. Não clique em links ou botões no site analisado.
              </div>
            </div>
          )}

          {/* Empty state */}
          {!screenshotUrl && !isLoading && !error && (
            <div className="text-center py-6">
              <p className="text-sm text-cyan-300/70">Clique em "Expandir" para capturar screenshot</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default URLSandboxPreview;
