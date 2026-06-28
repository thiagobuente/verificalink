import React from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface RiskSignal {
  icon: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskSignalsCardsProps {
  signals: RiskSignal[];
}

const severityConfig = {
  low: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500/50',
    icon: '🔵',
    label: 'Baixa',
    textColor: 'text-blue-300',
  },
  medium: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500/50',
    icon: '🟡',
    label: 'Média',
    textColor: 'text-yellow-300',
  },
  high: {
    bg: 'bg-orange-900/30',
    border: 'border-orange-500/50',
    icon: '🟠',
    label: 'Alta',
    textColor: 'text-orange-300',
  },
  critical: {
    bg: 'bg-red-900/30',
    border: 'border-red-500/50',
    icon: '🔴',
    label: 'Crítica',
    textColor: 'text-red-300',
  },
};

const iconMap: Record<string, React.ReactNode> = {
  '🔗': <span className="text-2xl">🔗</span>,
  '🔢': <span className="text-2xl">🔢</span>,
  '🎭': <span className="text-2xl">🎭</span>,
  '↪️': <span className="text-2xl">↪️</span>,
  '🚫': <span className="text-2xl">🚫</span>,
  '🎣': <span className="text-2xl">🎣</span>,
  '🦠': <span className="text-2xl">🦠</span>,
  '🚨': <span className="text-2xl">🚨</span>,
  '📅': <span className="text-2xl">📅</span>,
  '🌐': <span className="text-2xl">🌐</span>,
  '❓': <span className="text-2xl">❓</span>,
  '📏': <span className="text-2xl">📏</span>,
  '🔤': <span className="text-2xl">🔤</span>,
};

export function RiskSignalsCards({ signals }: RiskSignalsCardsProps) {
  if (signals.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <p className="text-green-300 font-semibold">Nenhum sinal de risco detectado</p>
        <p className="text-green-400/70 text-sm mt-1">URL aparenta ser segura</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {signals.map((signal, index) => {
        const config = severityConfig[signal.severity];

        return (
          <div
            key={index}
            className={`${config.bg} border ${config.border} rounded-lg p-4 transition-all hover:scale-105`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">
                {iconMap[signal.icon] || signal.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate">{signal.title}</h4>

                <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                  {signal.description}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${config.textColor} bg-black/30`}>
                    {config.icon} {config.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RiskSignalsCards;
