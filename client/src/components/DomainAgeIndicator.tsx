import { AlertTriangle, Calendar } from 'lucide-react';

interface DomainAgeIndicatorProps {
  createdDate?: string | Date;
  isLoading?: boolean;
}

export function DomainAgeIndicator({ createdDate, isLoading }: DomainAgeIndicatorProps) {
  if (!createdDate || isLoading) {
    return null;
  }

  const calculateDaysOld = (date: string | Date): number => {
    const created = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysOld = calculateDaysOld(createdDate);
  const isNewDomain = daysOld < 30; // Domínios com menos de 30 dias
  const isVeryNewDomain = daysOld < 7; // Domínios com menos de 7 dias

  if (daysOld < 1) {
    return null; // Não exibir se for criado hoje
  }

  const getRiskLevel = () => {
    if (isVeryNewDomain) return 'critical';
    if (isNewDomain) return 'high';
    return 'medium';
  };

  const getRiskColor = () => {
    const level = getRiskLevel();
    if (level === 'critical') return 'bg-red-900/30 border-red-500/50';
    if (level === 'high') return 'bg-orange-900/30 border-orange-500/50';
    return 'bg-yellow-900/30 border-yellow-500/50';
  };

  const getRiskTextColor = () => {
    const level = getRiskLevel();
    if (level === 'critical') return 'text-red-400';
    if (level === 'high') return 'text-orange-400';
    return 'text-yellow-400';
  };

  const getAlertIcon = () => {
    const level = getRiskLevel();
    if (level === 'critical') return '🚨';
    if (level === 'high') return '⚠️';
    return '⚡';
  };

  return (
    <div className={`domain-age-indicator ${getRiskColor()} border rounded-lg p-4 mb-4 flex items-start gap-3`}>
      <div className="flex-shrink-0 pt-1">
        <span className="text-2xl">{getAlertIcon()}</span>
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold ${getRiskTextColor()} flex items-center gap-2 mb-1`}>
          <Calendar size={16} />
          Domínio Recém-Criado
        </h4>
        <p className="text-sm text-gray-300">
          Este domínio foi criado há <span className="font-bold">{daysOld} dia{daysOld !== 1 ? 's' : ''}</span>.
          {isVeryNewDomain && ' Domínios muito novos são frequentemente usados em golpes.'}
          {isNewDomain && !isVeryNewDomain && ' Domínios novos podem indicar atividade suspeita.'}
          {!isNewDomain && ' Domínios recentes merecem atenção extra.'}
        </p>
      </div>
    </div>
  );
}
