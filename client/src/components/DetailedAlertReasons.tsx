import React from 'react';
import { AlertTriangle, Info, Lightbulb, TrendingUp } from 'lucide-react';

interface AlertReason {
  category: 'critical' | 'warning' | 'info' | 'recommendation';
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
}

interface DetailedAlertReasonsProps {
  reasons: AlertReason[];
  isLoading?: boolean;
}

export const DetailedAlertReasons: React.FC<DetailedAlertReasonsProps> = ({
  reasons,
  isLoading = false,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', borderColor: 'border-red-500' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', borderColor: 'border-orange-500' };
      case 'info':
        return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-500' };
      case 'recommendation':
        return { icon: Lightbulb, color: 'text-green-400', bg: 'bg-green-500/10', borderColor: 'border-green-500' };
      default:
        return { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10', borderColor: 'border-slate-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-600 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Agrupar por categoria
  const grouped = {
    critical: reasons.filter((r) => r.category === 'critical'),
    warning: reasons.filter((r) => r.category === 'warning'),
    info: reasons.filter((r) => r.category === 'info'),
    recommendation: reasons.filter((r) => r.category === 'recommendation'),
  };

  return (
    <div className="space-y-4">
      {/* Crítico */}
      {grouped.critical.length > 0 && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-red-400 mb-3">🚨 Alertas Críticos</h4>
          <div className="space-y-2">
            {grouped.critical.map((reason, idx) => {
              const categoryInfo = getCategoryIcon(reason.category);
              const Icon = categoryInfo.icon;
              return (
                <div
                  key={idx}
                  className={`${categoryInfo.bg} border-l-4 ${categoryInfo.borderColor} p-3 rounded`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${categoryInfo.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className={`${categoryInfo.color} font-bold text-sm`}>{reason.title}</p>
                      <p className="text-slate-300 text-sm mt-1">{reason.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aviso */}
      {grouped.warning.length > 0 && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-orange-400 mb-3">⚠️ Avisos</h4>
          <div className="space-y-2">
            {grouped.warning.map((reason, idx) => {
              const categoryInfo = getCategoryIcon(reason.category);
              const Icon = categoryInfo.icon;
              return (
                <div
                  key={idx}
                  className={`${categoryInfo.bg} border-l-4 ${categoryInfo.borderColor} p-3 rounded`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${categoryInfo.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className={`${categoryInfo.color} font-bold text-sm`}>{reason.title}</p>
                      <p className="text-slate-300 text-sm mt-1">{reason.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Informação */}
      {grouped.info.length > 0 && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-blue-400 mb-3">ℹ️ Informações Técnicas</h4>
          <div className="space-y-2">
            {grouped.info.map((reason, idx) => {
              const categoryInfo = getCategoryIcon(reason.category);
              const Icon = categoryInfo.icon;
              return (
                <div
                  key={idx}
                  className={`${categoryInfo.bg} border-l-4 ${categoryInfo.borderColor} p-3 rounded`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${categoryInfo.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className={`${categoryInfo.color} font-bold text-sm`}>{reason.title}</p>
                      <p className="text-slate-300 text-sm mt-1">{reason.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recomendação */}
      {grouped.recommendation.length > 0 && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <h4 className="text-lg font-bold text-green-400 mb-3">💡 Recomendações</h4>
          <div className="space-y-2">
            {grouped.recommendation.map((reason, idx) => {
              const categoryInfo = getCategoryIcon(reason.category);
              const Icon = categoryInfo.icon;
              return (
                <div
                  key={idx}
                  className={`${categoryInfo.bg} border-l-4 ${categoryInfo.borderColor} p-3 rounded`}
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className={`w-5 h-5 ${categoryInfo.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className={`${categoryInfo.color} font-bold text-sm`}>{reason.title}</p>
                      <p className="text-slate-300 text-sm mt-1">{reason.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reasons.length === 0 && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 text-center">
          <p className="text-slate-400">Nenhum alerta ou recomendação disponível.</p>
        </div>
      )}
    </div>
  );
};

export default DetailedAlertReasons;
