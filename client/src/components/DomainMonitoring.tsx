import React, { useState } from 'react';
import { Eye, Plus, Trash2, Bell, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MonitoredDomain {
  id: string;
  domain: string;
  riskScore: number;
  lastCheck: Date;
  status: 'safe' | 'warning' | 'danger';
  alerts: number;
  trend: 'stable' | 'improving' | 'worsening';
  notificationsEnabled: boolean;
}

interface DomainMonitoringProps {
  isLoading?: boolean;
}

const MOCK_MONITORED_DOMAINS: MonitoredDomain[] = [
  {
    id: '1',
    domain: 'google.com',
    riskScore: 2,
    lastCheck: new Date(Date.now() - 5 * 60000),
    status: 'safe',
    alerts: 0,
    trend: 'stable',
    notificationsEnabled: true,
  },
  {
    id: '2',
    domain: 'seu-banco.com.br',
    riskScore: 45,
    lastCheck: new Date(Date.now() - 15 * 60000),
    status: 'warning',
    alerts: 2,
    trend: 'worsening',
    notificationsEnabled: true,
  },
  {
    id: '3',
    domain: 'github.com',
    riskScore: 5,
    lastCheck: new Date(Date.now() - 30 * 60000),
    status: 'safe',
    alerts: 0,
    trend: 'improving',
    notificationsEnabled: false,
  },
];

export const DomainMonitoring: React.FC<DomainMonitoringProps> = ({ isLoading = false }) => {
  const [domains, setDomains] = useState<MonitoredDomain[]>(MOCK_MONITORED_DOMAINS);
  const [newDomain, setNewDomain] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;

    const newMonitoredDomain: MonitoredDomain = {
      id: Date.now().toString(),
      domain: newDomain.trim(),
      riskScore: Math.floor(Math.random() * 50),
      lastCheck: new Date(),
      status: Math.random() > 0.7 ? 'danger' : Math.random() > 0.4 ? 'warning' : 'safe',
      alerts: 0,
      trend: 'stable',
      notificationsEnabled: true,
    };

    setDomains([...domains, newMonitoredDomain]);
    setNewDomain('');
    setShowAddForm(false);
  };

  const handleRemoveDomain = (id: string) => {
    setDomains(domains.filter((d) => d.id !== id));
  };

  const handleToggleNotifications = (id: string) => {
    setDomains(
      domains.map((d) =>
        d.id === id ? { ...d, notificationsEnabled: !d.notificationsEnabled } : d
      )
    );
  };

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-500/10 border-green-500 text-green-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500 text-yellow-400';
      case 'danger':
        return 'bg-red-500/10 border-red-500 text-red-400';
      default:
        return 'bg-slate-500/10 border-slate-500 text-slate-400';
    }
  };

  const getRiskLabel = (status: string) => {
    switch (status) {
      case 'safe':
        return '✅ Seguro';
      case 'warning':
        return '⚠️ Atenção';
      case 'danger':
        return '🚨 Perigoso';
      default:
        return 'Desconhecido';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈 Melhorando';
      case 'worsening':
        return '📉 Piorando';
      default:
        return '➡️ Estável';
    }
  };

  if (isLoading) {
    return (
      <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse'>
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-20 bg-slate-600 rounded' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <Eye className='w-5 h-5 text-cyan-400' />
          <h4 className='text-lg font-bold text-cyan-400'>👁️ Monitoramento de Domínios</h4>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className='flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded transition-colors'
        >
          <Plus className='w-4 h-4' />
          Adicionar
        </button>
      </div>

      {/* Formulário de Adição */}
      {showAddForm && (
        <div className='mb-4 bg-slate-800/50 border border-slate-600 rounded p-3'>
          <p className='text-slate-400 text-sm font-bold mb-2'>Adicionar Domínio para Monitorar:</p>
          <div className='flex gap-2'>
            <input
              type='text'
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder='exemplo.com.br'
              className='flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400'
              onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
            />
            <button
              onClick={handleAddDomain}
              className='px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors'
            >
              Adicionar
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className='px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded transition-colors'
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Domínios */}
      <div className='space-y-2 max-h-96 overflow-y-auto'>
        {domains.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-slate-400 text-sm'>Nenhum domínio sendo monitorado.</p>
            <p className='text-slate-500 text-xs mt-1'>Adicione domínios para monitorar continuamente.</p>
          </div>
        ) : (
          domains.map((domain) => (
            <div
              key={domain.id}
              className={`border rounded-lg p-3 transition-all ${getRiskColor(domain.status)}`}
            >
              <div className='flex items-start justify-between gap-2 mb-2'>
                <div className='flex-1 min-w-0'>
                  <p className='font-bold text-sm truncate'>{domain.domain}</p>
                  <p className='text-xs opacity-75 mt-1'>{getRiskLabel(domain.status)}</p>
                </div>
                <div className='flex-shrink-0 text-right'>
                  <p className='font-bold text-lg'>{domain.riskScore}%</p>
                  <p className='text-xs opacity-75'>Risco</p>
                </div>
              </div>

              {/* Barra de Risco */}
              <div className='flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2'>
                <div
                  className={`h-full transition-all ${
                    domain.riskScore >= 70
                      ? 'bg-red-500'
                      : domain.riskScore >= 40
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${domain.riskScore}%` }}
                />
              </div>

              {/* Informações */}
              <div className='grid grid-cols-2 gap-2 mb-2 text-xs'>
                <div>
                  <span className='opacity-75'>Última verificação:</span>
                  <p className='font-mono text-xs'>
                    {domain.lastCheck.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className='opacity-75'>Tendência:</span>
                  <p className='font-bold'>{getTrendIcon(domain.trend)}</p>
                </div>
              </div>

              {/* Alertas */}
              {domain.alerts > 0 && (
                <div className='bg-slate-800/50 rounded p-2 mb-2 text-xs'>
                  <p className='font-bold'>🚨 {domain.alerts} alerta(s) recente(s)</p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className='flex gap-2'>
                <button
                  onClick={() => handleToggleNotifications(domain.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-bold rounded transition-colors ${
                    domain.notificationsEnabled
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <Bell className='w-3 h-3' />
                  {domain.notificationsEnabled ? 'Notificações ON' : 'Notificações OFF'}
                </button>

                <button
                  onClick={() => handleRemoveDomain(domain.id)}
                  className='flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors'
                >
                  <Trash2 className='w-3 h-3' />
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumo */}
      {domains.length > 0 && (
        <div className='mt-4 pt-4 border-t border-slate-600 grid grid-cols-3 gap-2'>
          <div className='text-center'>
            <p className='text-slate-400 text-xs mb-1'>Total</p>
            <p className='text-cyan-400 font-bold'>{domains.length}</p>
          </div>
          <div className='text-center'>
            <p className='text-slate-400 text-xs mb-1'>Seguro</p>
            <p className='text-green-400 font-bold'>{domains.filter((d) => d.status === 'safe').length}</p>
          </div>
          <div className='text-center'>
            <p className='text-slate-400 text-xs mb-1'>Perigoso</p>
            <p className='text-red-400 font-bold'>{domains.filter((d) => d.status === 'danger').length}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className='mt-4 bg-blue-500/10 border border-blue-500 rounded p-3'>
        <p className='text-blue-400 font-bold text-sm mb-1'>💡 Como funciona:</p>
        <p className='text-blue-300 text-xs'>
          Monitore domínios continuamente. Receba alertas em tempo real se houver mudanças na reputação ou novas ameaças detectadas.
        </p>
      </div>
    </div>
  );
};

export default DomainMonitoring;
