import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export interface ReputationSource {
  name: string;
  status: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  details: string;
  icon: string;
  color: string;
}

interface ReputationSourcesProps {
  sources: ReputationSource[];
}

const statusConfig = {
  safe: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-900/20',
    border: 'border-green-500/30',
    label: '✅ Seguro',
  },
  suspicious: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/30',
    label: '⚠️ Suspeito',
  },
  malicious: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-900/20',
    border: 'border-red-500/30',
    label: '🚫 Malicioso',
  },
  unknown: {
    icon: AlertCircle,
    color: 'text-gray-400',
    bg: 'bg-gray-900/20',
    border: 'border-gray-500/30',
    label: '❓ Desconhecido',
  },
};

export function ReputationSources({ sources }: ReputationSourcesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">Fontes de Reputação</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((source, index) => {
          const config = statusConfig[source.status];
          const IconComponent = config.icon;

          return (
            <div
              key={index}
              className={`${config.bg} border ${config.border} rounded-lg p-4 transition-all hover:scale-105`}
            >
              <div className="flex items-start gap-3">
                <IconComponent className={`w-6 h-6 ${config.color} flex-shrink-0 mt-1`} />

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white">{source.name}</h4>

                  <p className="text-sm text-gray-300 mt-1">{source.details}</p>

                  <div className="mt-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded bg-black/30 ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-300">
        <p>
          <strong>💡 Dica:</strong> Múltiplas fontes de reputação fornecem análise mais confiável.
          Se uma fonte detectar malware, recomenda-se não clicar no link.
        </p>
      </div>
    </div>
  );
}

export default ReputationSources;
