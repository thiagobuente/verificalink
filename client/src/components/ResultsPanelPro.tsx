import { useState } from 'react';
import { ChevronDown, Copy, Share2, AlertCircle, CheckCircle, AlertTriangle, Link as LinkIcon, Hash, Zap, Eye, Shield, ExternalLink } from 'lucide-react';
import { RiskGauge } from './RiskGauge';

interface RiskIndicator {
  icon: React.ReactNode;
  label: string;
  description: string;
}

interface ReputationSource {
  name: string;
  status: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
  detections?: number;
  total?: number;
  details: string;
}

interface ResultsPanelProProps {
  url: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskIndicators: RiskIndicator[];
  recommendations: {
    do: string[];
    dont: string[];
    warning?: string;
  };
  reputationSources: ReputationSource[];
  onShare?: () => void;
}

export function ResultsPanelPro({
  url,
  riskScore,
  riskLevel,
  riskIndicators,
  recommendations,
  reputationSources,
  onShare,
}: ResultsPanelProProps) {
  const [copied, setCopied] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);

  const handleCopyURL = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'from-green-500/20 to-green-500/5 border-green-500/30';
      case 'MEDIUM':
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 'HIGH':
        return 'from-red-500/20 to-red-500/5 border-red-500/30';
      default:
        return 'from-gray-500/20 to-gray-500/5 border-gray-500/30';
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'LOW':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'HIGH':
        return '🔴';
      default:
        return '❓';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'Baixo Risco';
      case 'MEDIUM':
        return 'Médio Risco';
      case 'HIGH':
        return 'Alto Risco';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de URL Analisada */}
      <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 backdrop-blur">
        <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wide mb-2">URL Analisada</div>
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <code className="text-xs text-gray-300 truncate font-mono bg-black/30 px-2 py-1 rounded flex-1">
            {url}
          </code>
          <button
            onClick={handleCopyURL}
            className="p-2 hover:bg-cyan-500/20 rounded transition text-cyan-400 hover:text-cyan-300"
            title="Copiar URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          {copied && <span className="text-xs text-green-400">✓ Copiado</span>}
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className={`p-6 rounded-lg border bg-gradient-to-br ${getRiskColor(riskLevel)} backdrop-blur`}>
        <div className="flex items-start gap-6">
          {/* Velocímetro */}
          <div className="flex-shrink-0">
            <RiskGauge score={riskScore} size="md" />
          </div>

          {/* Resumo Textual */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{getRiskEmoji(riskLevel)}</span>
              <h3 className={`text-xl font-bold ${
                riskLevel === 'LOW' ? 'text-green-400' :
                riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {getRiskLabel(riskLevel)}
              </h3>
            </div>

            {/* Motivos */}
            {riskIndicators.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="text-sm font-semibold text-gray-300">Motivos:</div>
                <ul className="space-y-1">
                  {riskIndicators.map((indicator, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-lg flex-shrink-0">{indicator.icon}</span>
                      <div>
                        <div className="font-medium">{indicator.label}</div>
                        <div className="text-xs text-gray-400">{indicator.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendações */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-300">Recomendações:</div>
              <div className="space-y-1">
                {recommendations.dont.map((rec, i) => (
                  <div key={`dont-${i}`} className="flex items-center gap-2 text-sm text-red-300">
                    <span className="text-lg">❌</span>
                    <span>{rec}</span>
                  </div>
                ))}
                {recommendations.do.map((rec, i) => (
                  <div key={`do-${i}`} className="flex items-center gap-2 text-sm text-green-300">
                    <span className="text-lg">✓</span>
                    <span>{rec}</span>
                  </div>
                ))}
                {recommendations.warning && (
                  <div className="flex items-center gap-2 text-sm text-yellow-300 mt-2 pt-2 border-t border-yellow-500/30">
                    <span className="text-lg">⚠️</span>
                    <span>{recommendations.warning}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fontes de Reputação */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Verificação por Fonte</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reputationSources.map((source, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border backdrop-blur ${
                source.status === 'SAFE' ? 'bg-green-500/10 border-green-500/30' :
                source.status === 'SUSPICIOUS' ? 'bg-yellow-500/10 border-yellow-500/30' :
                source.status === 'MALICIOUS' ? 'bg-red-500/10 border-red-500/30' :
                'bg-gray-500/10 border-gray-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm">{source.name}</div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${
                  source.status === 'SAFE' ? 'bg-green-500/20 text-green-300' :
                  source.status === 'SUSPICIOUS' ? 'bg-yellow-500/20 text-yellow-300' :
                  source.status === 'MALICIOUS' ? 'bg-red-500/20 text-red-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {source.status === 'SAFE' ? '✓ Seguro' :
                   source.status === 'SUSPICIOUS' ? '⚠️ Suspeito' :
                   source.status === 'MALICIOUS' ? '🚨 Malicioso' :
                   '❓ Desconhecido'}
                </div>
              </div>
              <div className="text-xs text-gray-300 mb-2">{source.details}</div>
              {source.detections !== undefined && source.total !== undefined && (
                <div className="text-xs font-mono text-gray-400">
                  {source.detections}/{source.total} detecções
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Análise Detalhada (Acordeão) */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedDetails(!expandedDetails)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-900/50 transition text-left"
        >
          <span className="font-semibold text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Ver Análise Detalhada
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expandedDetails ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedDetails && (
          <div className="border-t border-gray-700 p-4 space-y-4 bg-black/30">
            {/* Aqui você pode adicionar análise técnica detalhada */}
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-gray-300">Indicadores Técnicos:</div>
              <ul className="space-y-1 text-gray-400 list-disc list-inside">
                <li>Domínio: {new URL(url).hostname}</li>
                <li>Protocolo: {new URL(url).protocol}</li>
                <li>Comprimento da URL: {url.length} caracteres</li>
                <li>Parâmetros: {new URL(url).search ? 'Sim' : 'Não'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Botão Compartilhar */}
      {onShare && (
        <button
          onClick={onShare}
          className="w-full py-2 px-4 rounded-lg border border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-cyan-300"
        >
          <Share2 className="w-4 h-4" />
          📤 Compartilhar Análise
        </button>
      )}
    </div>
  );
}
