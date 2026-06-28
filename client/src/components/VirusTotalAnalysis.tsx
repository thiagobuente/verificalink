/**
 * VirusTotal Analysis Component
 * Displays malware detection results from VirusTotal
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Shield,
  TrendingUp,
  Calendar,
  Database,
  Zap,
} from 'lucide-react';

interface VirusTotalResult {
  hash: string;
  found: boolean;
  detections: number;
  vendors: number;
  lastAnalysisDate?: Date;
  malwareNames: string[];
  threatCategories: string[];
  riskLevel: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  vendors_detected: {
    vendor: string;
    category: string;
    engine_name: string;
  }[];
}

interface VirusTotalAnalysisProps {
  result: VirusTotalResult;
  fileHash: string;
  isLoading?: boolean;
  onRetry?: () => void;
}

const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'malicious':
      return 'from-red-600/20 to-red-900/20 border-red-500/30 text-red-400';
    case 'suspicious':
      return 'from-orange-600/20 to-orange-900/20 border-orange-500/30 text-orange-400';
    case 'unknown':
      return 'from-yellow-600/20 to-yellow-900/20 border-yellow-500/30 text-yellow-400';
    case 'clean':
      return 'from-green-600/20 to-green-900/20 border-green-500/30 text-green-400';
    default:
      return 'from-slate-600/20 to-slate-900/20 border-slate-500/30 text-slate-400';
  }
};

const getRiskIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case 'malicious':
      return <AlertTriangle className="w-6 h-6 text-red-400" />;
    case 'suspicious':
      return <AlertCircle className="w-6 h-6 text-orange-400" />;
    case 'unknown':
      return <AlertCircle className="w-6 h-6 text-yellow-400" />;
    case 'clean':
      return <CheckCircle className="w-6 h-6 text-green-400" />;
    default:
      return <Shield className="w-6 h-6 text-slate-400" />;
  }
};

const getRiskLabel = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'malicious':
      return 'MALICIOSO';
    case 'suspicious':
      return 'SUSPEITO';
    case 'unknown':
      return 'DESCONHECIDO';
    case 'clean':
      return 'LIMPO';
    default:
      return 'DESCONHECIDO';
  }
};

const formatDate = (date?: Date): string => {
  if (!date) return 'Não disponível';
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const VirusTotalAnalysis: React.FC<VirusTotalAnalysisProps> = ({
  result,
  fileHash,
  isLoading,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-slate-700/50 rounded-lg"></div>
        <div className="h-40 bg-slate-700/50 rounded-lg"></div>
      </div>
    );
  }

  const shouldBlock = result.riskLevel === 'malicious' || result.riskLevel === 'suspicious';

  return (
    <div className="space-y-6">
      {/* Main Risk Card */}
      <div
        className={`bg-gradient-to-br ${getRiskColor(result.riskLevel)} border rounded-lg p-6 backdrop-blur-sm`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {getRiskIcon(result.riskLevel)}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Verificação VirusTotal</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Detecções</p>
                  <p className="text-2xl font-bold text-cyan-400">{result.detections}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Antivírus</p>
                  <p className="text-2xl font-bold text-cyan-400">{result.vendors}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Encontrado</p>
                  <p className="text-2xl font-bold text-cyan-400">{result.found ? '✅ Sim' : '❌ Não'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Status</p>
                  <p className="text-xl font-bold text-white">{getRiskLabel(result.riskLevel)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hash Information */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Hash do Arquivo
        </h4>
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 font-mono text-sm">
          <p className="text-slate-300 break-all">{fileHash}</p>
          <p className="text-slate-500 text-xs mt-2">SHA-256</p>
        </div>
        {result.lastAnalysisDate && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Última análise: {formatDate(result.lastAnalysisDate)}</span>
          </div>
        )}
      </div>

      {/* Detection Details */}
      {result.found && result.detections > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Malwares Detectados
          </h4>

          {/* Malware Names */}
          {result.malwareNames.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Nomes de Malware:</p>
              <div className="space-y-1">
                {result.malwareNames.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-slate-700/30 rounded border border-slate-600/50"
                  >
                    <span className="text-red-400">🦠</span>
                    <span className="text-slate-300 text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threat Categories */}
          {result.threatCategories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Categorias de Ameaça:</p>
              <div className="flex flex-wrap gap-2">
                {result.threatCategories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-semibold"
                  >
                    {category.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vendors Detected */}
          {result.vendors_detected.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Antivírus que Detectaram:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.vendors_detected.slice(0, 10).map((vendor, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-slate-700/30 rounded border border-slate-600/50 text-xs"
                  >
                    <span className="text-red-400 mt-0.5">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-300">{vendor.engine_name}</p>
                      <p className="text-slate-500">{vendor.category}</p>
                    </div>
                  </div>
                ))}
                {result.vendors_detected.length > 10 && (
                  <p className="text-slate-500 text-xs p-2">
                    +{result.vendors_detected.length - 10} mais antivírus detectaram
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean File Message */}
      {result.riskLevel === 'clean' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
          <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-400" />
          <p className="text-green-400 font-semibold">Arquivo Limpo</p>
          <p className="text-green-300 text-sm mt-1">Nenhum malware conhecido detectado</p>
        </div>
      )}

      {/* Unknown File Message */}
      {!result.found && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
          <p className="text-yellow-400 font-semibold">Arquivo Desconhecido</p>
          <p className="text-yellow-300 text-sm mt-1">
            Este arquivo não foi encontrado no banco de dados do VirusTotal
          </p>
          <p className="text-yellow-300 text-xs mt-2">
            Pode ser um arquivo novo ou não foi analisado anteriormente
          </p>
        </div>
      )}

      {/* Block Warning */}
      {shouldBlock && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-red-400 font-bold mb-2">⛔ ATENÇÃO - ARQUIVO POTENCIALMENTE PERIGOSO</p>
              <ul className="text-red-300 text-sm space-y-1 list-disc list-inside">
                <li>Não abra este arquivo a menos que confie completamente na origem</li>
                <li>Não execute scripts ou macros contidos no PDF</li>
                <li>Considere usar uma máquina virtual ou sandbox para análise</li>
                <li>Reporte este arquivo ao seu administrador de TI</li>
                <li>Se recebeu por email, reporte como spam/phishing</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Verificar Novamente
        </button>
      )}

      {/* VirusTotal Link */}
      <div className="text-center">
        <a
          href={`https://www.virustotal.com/gui/search/${fileHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
        >
          🔗 Ver análise completa no VirusTotal
        </a>
      </div>
    </div>
  );
};

export default VirusTotalAnalysis;
