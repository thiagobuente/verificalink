import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export interface URLhausData {
  isMalicious: boolean;
  threat: string | null;
  tags: string[];
  dateAdded: string | null;
  status: string;
  reference: string | null;
}

interface URLhausResultProps {
  data: URLhausData;
  isLoading: boolean;
}

const getThreatColor = (threat: string): string => {
  const threatLower = threat?.toLowerCase() || '';
  if (threatLower.includes('malware')) return 'from-red-900/40 to-red-800/40 border-red-500';
  if (threatLower.includes('phishing')) return 'from-orange-900/40 to-orange-800/40 border-orange-500';
  if (threatLower.includes('exploit')) return 'from-purple-900/40 to-purple-800/40 border-purple-500';
  if (threatLower.includes('trojan')) return 'from-red-900/40 to-red-800/40 border-red-500';
  return 'from-yellow-900/40 to-yellow-800/40 border-yellow-500';
};

const getThreatTextColor = (threat: string): string => {
  const threatLower = threat?.toLowerCase() || '';
  if (threatLower.includes('malware')) return 'text-red-400';
  if (threatLower.includes('phishing')) return 'text-orange-400';
  if (threatLower.includes('exploit')) return 'text-purple-400';
  if (threatLower.includes('trojan')) return 'text-red-400';
  return 'text-yellow-400';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'malicious':
      return <XCircle className="w-6 h-6 text-red-400" />;
    case 'offline':
      return <AlertCircle className="w-6 h-6 text-yellow-400" />;
    case 'clean':
      return <CheckCircle className="w-6 h-6 text-green-400" />;
    default:
      return <AlertCircle className="w-6 h-6 text-gray-400" />;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'malicious':
      return '🚨 Malicioso Detectado';
    case 'offline':
      return '⚠️ Malicioso (Offline)';
    case 'clean':
      return '✅ Limpo';
    default:
      return '❓ Desconhecido';
  }
};

export function URLhausResult({ data, isLoading }: URLhausResultProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-500/20 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-700/40 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-700/40 rounded w-1/2"></div>
      </div>
    );
  }

  const isMalicious = data.isMalicious;
  const statusLabel = getStatusLabel(data.status);
  const bgColor = isMalicious
    ? 'from-red-900/20 to-red-800/20 border-red-500/30'
    : 'from-green-900/20 to-green-800/20 border-green-500/30';

  return (
    <div className={`bg-gradient-to-br ${bgColor} border rounded-lg p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(data.status)}
          <div>
            <h3 className="text-lg font-semibold text-white">URLhaus</h3>
            <p className={`text-sm font-medium ${isMalicious ? 'text-red-400' : 'text-green-400'}`}>
              {statusLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Threat Information */}
      {isMalicious && data.threat && (
        <div className={`bg-gradient-to-br ${getThreatColor(data.threat)} border rounded-lg p-4`}>
          <p className={`text-sm font-semibold ${getThreatTextColor(data.threat)}`}>
            Tipo de Ameaça: {data.threat}
          </p>
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">Tags Detectadas:</p>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-xs font-medium text-cyan-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Date Added */}
      {data.dateAdded && (
        <div className="text-sm text-gray-400">
          <span className="font-medium text-gray-300">Adicionado em:</span> {new Date(data.dateAdded).toLocaleDateString('pt-BR')}
        </div>
      )}

      {/* Reference Link */}
      {data.reference && (
        <a
          href={`https://urlhaus.abuse.ch/browse/url/${data.reference}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-cyan-400 hover:text-cyan-300 underline"
        >
          Ver no URLhaus →
        </a>
      )}

      {/* Clean Status Message */}
      {!isMalicious && (
        <p className="text-sm text-green-400">
          ✓ Esta URL não foi encontrada no banco de dados de URLhaus como maliciosa.
        </p>
      )}
    </div>
  );
}
