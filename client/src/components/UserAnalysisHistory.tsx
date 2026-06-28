import React, { useState } from 'react';
import { Clock, Trash2, Share2, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisRecord {
  id: string;
  url: string;
  type: 'link' | 'message' | 'qrcode';
  riskScore: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  timestamp: Date;
  threats: string[];
  shared: boolean;
}

interface UserAnalysisHistoryProps {
  isLoading?: boolean;
}

const MOCK_HISTORY: AnalysisRecord[] = [
  {
    id: '1',
    url: 'https://exemplo-banco.com.br/login',
    type: 'link',
    riskScore: 92,
    riskLevel: 'danger',
    timestamp: new Date(Date.now() - 5 * 60000),
    threats: ['Phishing', 'Fake Banking'],
    shared: false,
  },
  {
    id: '2',
    url: 'https://google.com',
    type: 'link',
    riskScore: 2,
    riskLevel: 'safe',
    timestamp: new Date(Date.now() - 15 * 60000),
    threats: [],
    shared: true,
  },
  {
    id: '3',
    url: 'bit.ly/teste123',
    type: 'link',
    riskScore: 45,
    riskLevel: 'warning',
    timestamp: new Date(Date.now() - 30 * 60000),
    threats: ['URL Encurtada'],
    shared: false,
  },
  {
    id: '4',
    url: 'Clique aqui para ganhar R$1000!',
    type: 'message',
    riskScore: 78,
    riskLevel: 'danger',
    timestamp: new Date(Date.now() - 1 * 3600000),
    threats: ['Engenharia Social', 'Promessa de Ganho'],
    shared: false,
  },
  {
    id: '5',
    url: 'https://seguro.com.br',
    type: 'link',
    riskScore: 8,
    riskLevel: 'safe',
    timestamp: new Date(Date.now() - 2 * 3600000),
    threats: [],
    shared: false,
  },
];

export const UserAnalysisHistory: React.FC<UserAnalysisHistoryProps> = ({ isLoading = false }) => {
  const [history, setHistory] = useState<AnalysisRecord[]>(MOCK_HISTORY);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'safe' | 'warning' | 'danger'>('all');

  const filteredHistory = filterLevel === 'all' ? history : history.filter((h) => h.riskLevel === filterLevel);

  const getRiskColor = (level: string) => {
    switch (level) {
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

  const getRiskLabel = (level: string) => {
    switch (level) {
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

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleDelete = (id: string) => {
    setHistory(history.filter((h) => h.id !== id));
  };

  const handleShare = (record: AnalysisRecord) => {
    const message = `🛡️ Shield Security Scanner\n\nAnalisei este ${record.type === 'link' ? 'link' : 'texto'} e encontrei:\n\nRisco: ${record.riskScore}%\nStatus: ${getRiskLabel(record.riskLevel)}\n\n${record.threats.length > 0 ? `Ameaças: ${record.threats.join(', ')}` : 'Nenhuma ameaça detectada'}\n\nUse o Shield para proteger você e sua família!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
      <div className='flex items-center gap-2 mb-4'>
        <Clock className='w-5 h-5 text-cyan-400' />
        <h4 className='text-lg font-bold text-cyan-400'>📋 Histórico de Análises</h4>
      </div>

      {/* Filtros */}
      <div className='flex gap-2 mb-4 flex-wrap'>
        {['all', 'safe', 'warning', 'danger'].map((level) => (
          <button
            key={level}
            onClick={() => setFilterLevel(level as any)}
            className={`px-3 py-1 rounded text-sm font-bold transition-all ${
              filterLevel === level
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {level === 'all' ? 'Todos' : level === 'safe' ? '✅ Seguro' : level === 'warning' ? '⚠️ Atenção' : '🚨 Perigoso'}
          </button>
        ))}
      </div>

      {/* Lista de análises */}
      <div className='space-y-2 max-h-96 overflow-y-auto'>
        {filteredHistory.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-slate-400 text-sm'>Nenhuma análise encontrada nesta categoria.</p>
          </div>
        ) : (
          filteredHistory.map((record) => (
            <div
              key={record.id}
              className={`border rounded-lg p-3 transition-all ${getRiskColor(record.riskLevel)}`}
            >
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-xs font-bold px-2 py-1 bg-slate-800 rounded'>
                      {record.type === 'link' ? '🔗 Link' : record.type === 'message' ? '💬 Mensagem' : '📱 QR Code'}
                    </span>
                    <span className='text-xs text-slate-400'>{formatTime(record.timestamp)}</span>
                    {record.shared && <span className='text-xs text-blue-400'>✓ Compartilhado</span>}
                  </div>

                  <p className='text-sm font-mono truncate text-slate-300 mb-1'>
                    {record.url.length > 50 ? `${record.url.substring(0, 50)}...` : record.url}
                  </p>

                  <div className='flex items-center gap-2'>
                    <div className='flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden'>
                      <div
                        className={`h-full transition-all ${
                          record.riskScore >= 70
                            ? 'bg-red-500'
                            : record.riskScore >= 40
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${record.riskScore}%` }}
                      />
                    </div>
                    <span className='text-xs font-bold'>{record.riskScore}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  className='flex-shrink-0 p-1 hover:bg-slate-700 rounded'
                >
                  <MoreVertical className='w-4 h-4' />
                </button>
              </div>

              {/* Expandido */}
              {expandedId === record.id && (
                <div className='mt-3 pt-3 border-t border-current/20 space-y-2'>
                  {record.threats.length > 0 && (
                    <div>
                      <p className='text-xs font-bold mb-1'>Ameaças Detectadas:</p>
                      <div className='flex flex-wrap gap-1'>
                        {record.threats.map((threat, idx) => (
                          <span key={idx} className='text-xs bg-slate-800 px-2 py-1 rounded'>
                            {threat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='flex gap-2 pt-2'>
                    <button
                      onClick={() => handleShare(record)}
                      className='flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors'
                    >
                      <Share2 className='w-3 h-3' />
                      Compartilhar
                    </button>

                    <button
                      onClick={() => handleDelete(record.id)}
                      className='flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors'
                    >
                      <Trash2 className='w-3 h-3' />
                      Deletar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resumo */}
      <div className='mt-4 pt-4 border-t border-slate-600 grid grid-cols-3 gap-2'>
        <div className='text-center'>
          <p className='text-slate-400 text-xs mb-1'>Total</p>
          <p className='text-cyan-400 font-bold'>{history.length}</p>
        </div>
        <div className='text-center'>
          <p className='text-slate-400 text-xs mb-1'>Seguro</p>
          <p className='text-green-400 font-bold'>{history.filter((h) => h.riskLevel === 'safe').length}</p>
        </div>
        <div className='text-center'>
          <p className='text-slate-400 text-xs mb-1'>Perigoso</p>
          <p className='text-red-400 font-bold'>{history.filter((h) => h.riskLevel === 'danger').length}</p>
        </div>
      </div>
    </div>
  );
};

export default UserAnalysisHistory;
