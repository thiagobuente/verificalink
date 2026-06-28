/**
 * Domain Timeline Display Component
 * Exibe timeline de histórico de domínio
 */

import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, Clock, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface DomainTimelineDisplayProps {
  domain: string;
  onLoadingChange?: (loading: boolean) => void;
}

interface DomainTimelineEvent {
  date: Date;
  type: 'registration' | 'expiration' | 'registrar-change' | 'threat' | 'analysis';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, any>;
}

export const DomainTimelineDisplay: React.FC<DomainTimelineDisplayProps> = ({ domain, onLoadingChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timelineData, setTimelineData] = useState<any>(null);

  // Usar tRPC para buscar timeline
  const { data, isLoading, error } = trpc.timeline.getDomainTimeline.useQuery(
    { domain },
    { enabled: isExpanded && !timelineData } // Apenas buscar quando expandir
  );

  useEffect(() => {
    if (data?.success && data?.data) {
      setTimelineData(data.data);
    }
  }, [data]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'Desconhecido';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getDomainAgeLabel = (age: number) => {
    if (age < 0) return 'Desconhecido';
    if (age < 30) return `Muito recente (${age} dias)`;
    if (age < 90) return `Recente (${age} dias)`;
    if (age < 365) return `${Math.floor(age / 30)} meses`;
    return `${Math.floor(age / 365)} anos`;
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 70) return 'bg-red-600 text-white';
    if (riskScore >= 40) return 'bg-orange-600 text-white';
    if (riskScore >= 20) return 'bg-yellow-600 text-white';
    return 'bg-green-600 text-white';
  };

  const getEventIcon = (type: string, severity: string) => {
    if (severity === 'critical') return '🚨';
    if (severity === 'warning') return '⚠️';
    if (type === 'registration') return '📝';
    if (type === 'expiration') return '⏰';
    if (type === 'threat') return '🔴';
    return 'ℹ️';
  };

  const getEventColor = (severity: string) => {
    if (severity === 'critical') return 'border-red-500/50 bg-red-900/10';
    if (severity === 'warning') return 'border-orange-500/50 bg-orange-900/10';
    return 'border-cyan-500/30 bg-cyan-900/10';
  };

  return (
    <div className="w-full space-y-3">
      {/* Header com botão de expandir */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg hover:border-purple-500 transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-300">📅 Timeline do Domínio</p>
              <p className="text-xs text-purple-400/70">Histórico de registro e mudanças</p>
            </div>
          </div>
          <div className="text-purple-400">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="space-y-3 p-4 bg-slate-800/50 border border-purple-500/30 rounded-lg">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-purple-300">Carregando timeline...</span>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Erro ao carregar timeline</p>
                <p className="text-xs text-red-300/70">{error.message}</p>
              </div>
            </div>
          )}

          {/* Timeline data */}
          {timelineData && !isLoading && (
            <div className="space-y-4">
              {/* Domain info header */}
              <div className="p-3 bg-slate-700/50 rounded-lg border border-purple-500/20">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-purple-300/70">Idade do Domínio</p>
                    <p className="text-sm font-semibold text-purple-300">
                      {getDomainAgeLabel(timelineData.age)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-300/70">Score de Risco</p>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRiskBadgeColor(timelineData.riskScore)}`}>
                      {timelineData.riskScore}/100
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-purple-300/70">Registrador</p>
                    <p className="text-sm text-purple-300">{timelineData.registrar || 'Desconhecido'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-300/70">Pais de Origem</p>
                    <p className="text-sm text-purple-300">
                      {timelineData.registrarCountry || 'Desconhecido'} {timelineData.registrarCountryCode && timelineData.registrarCountryCode !== 'XX' ? `(${timelineData.registrarCountryCode})` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {timelineData.recommendations && timelineData.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-purple-300">Recomendações:</p>
                  <div className="space-y-1">
                    {timelineData.recommendations.map((rec: string, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-700/30 rounded text-xs text-purple-300/80 flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5">{rec.charAt(0)}</span>
                        <span>{rec.substring(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline events */}
              {timelineData.events && timelineData.events.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-purple-300">Eventos:</p>
                  <div className="space-y-2 relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-transparent" />

                    {timelineData.events.map((event: DomainTimelineEvent, idx: number) => (
                      <div key={idx} className={`pl-12 pb-3 relative border-l-2 ${getEventColor(event.severity)} p-2 rounded`}>
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-800 -translate-x-1.5" />

                        {/* Event content */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-purple-300">
                                {getEventIcon(event.type, event.severity)} {event.title}
                              </p>
                              <p className="text-xs text-purple-300/70 mt-0.5">{event.description}</p>
                            </div>
                            <span className="text-xs text-purple-400/70 flex-shrink-0">
                              {formatDate(event.date)}
                            </span>
                          </div>

                          {/* Event details */}
                          {event.details && Object.keys(event.details).length > 0 && (
                            <div className="mt-2 text-xs text-purple-300/60 space-y-0.5">
                              {Object.entries(event.details).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-purple-400">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration/Expiration dates */}
              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-700/30 rounded">
                <div>
                  <p className="text-xs text-purple-300/70">Registrado em</p>
                  <p className="text-sm font-semibold text-purple-300">
                    {formatDate(timelineData.registrationDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-300/70">Expira em</p>
                  <p className="text-sm font-semibold text-purple-300">
                    {formatDate(timelineData.expirationDate)}
                  </p>
                </div>
              </div>

              {/* Summary */}
              {timelineData.summary && (
                <div className="p-2 bg-purple-900/20 border border-purple-500/30 rounded-lg text-xs text-purple-300">
                  {timelineData.summary}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!timelineData && !isLoading && !error && (
            <div className="text-center py-6">
              <p className="text-sm text-purple-300/70">Clique em "Expandir" para carregar timeline</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DomainTimelineDisplay;
