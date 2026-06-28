import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

interface SourceReputation {
  name: string;
  status: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  details?: string;
  threats?: number;
}

interface ConsolidatedReputationProps {
  sources: SourceReputation[];
  isLoading?: boolean;
}

export const ConsolidatedReputation: React.FC<ConsolidatedReputationProps> = ({
  sources,
  isLoading = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean':
        return { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Limpo' };
      case 'suspicious':
        return { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Suspeito' };
      case 'malicious':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Malicioso' };
      default:
        return { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Desconhecido' };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-slate-600 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <h4 className="text-lg font-bold text-cyan-400 mb-4">🛡️ Reputação Consolidada</h4>
      <div className="space-y-2">
        {sources.map((source, idx) => {
          const statusInfo = getStatusIcon(source.status);
          const Icon = statusInfo.icon;

          return (
            <div
              key={idx}
              className={`${statusInfo.bg} border-l-4 ${statusInfo.color} p-3 rounded flex items-center justify-between`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 font-semibold text-sm">{source.name}</p>
                  {source.details && (
                    <p className="text-slate-400 text-xs">{source.details}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {source.threats !== undefined && source.threats > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold">
                    {source.threats} detecções
                  </span>
                )}
                <span className={`${statusInfo.color} text-xs font-bold whitespace-nowrap`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo */}
      <div className="mt-4 pt-4 border-t border-slate-600">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-green-400 font-bold text-lg">
              {sources.filter((s) => s.status === 'clean').length}
            </div>
            <div className="text-slate-400 text-xs">Limpos</div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold text-lg">
              {sources.filter((s) => s.status === 'suspicious').length}
            </div>
            <div className="text-slate-400 text-xs">Suspeitos</div>
          </div>
          <div>
            <div className="text-red-400 font-bold text-lg">
              {sources.filter((s) => s.status === 'malicious').length}
            </div>
            <div className="text-slate-400 text-xs">Maliciosos</div>
          </div>
          <div>
            <div className="text-slate-400 font-bold text-lg">
              {sources.filter((s) => s.status === 'unknown').length}
            </div>
            <div className="text-slate-400 text-xs">Desconhecidos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedReputation;
