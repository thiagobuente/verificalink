import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface ReputationSource {
  name: string;
  status: 'clean' | 'suspicious' | 'malicious' | 'unknown' | 'loading';
  details?: string;
  icon?: React.ReactNode;
}

interface ExternalReputationProps {
  sources: ReputationSource[];
  isLoading?: boolean;
}

const statusConfig = {
  clean: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: 'Limpo',
  },
  suspicious: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: <AlertCircle className="w-5 h-5" />,
    label: 'Suspeito',
  },
  malicious: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="w-5 h-5" />,
    label: 'Malicioso',
  },
  unknown: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    icon: <AlertCircle className="w-5 h-5" />,
    label: 'Sem indicadores',
  },
  loading: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    label: 'Analisando...',
  },
};

export const ExternalReputation: React.FC<ExternalReputationProps> = ({
  sources,
  isLoading = false,
}) => {
  if (isLoading || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        🛡️ Reputação Externa
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((source, index) => {
          const config = statusConfig[source.status];
          
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} flex items-start gap-3`}
            >
              <div className={`flex-shrink-0 ${config.color} mt-0.5`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {source.name}
                  </p>
                  <span className={`text-xs font-medium ${config.color} whitespace-nowrap`}>
                    {config.label}
                  </span>
                </div>
                {source.details && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {source.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 text-center">
        Análise baseada em 14 fontes de inteligência de ameaças
      </p>
    </div>
  );
};

export default ExternalReputation;
