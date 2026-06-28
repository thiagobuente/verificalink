import React from 'react';

interface RiskScoreVisualProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScoreVisual: React.FC<RiskScoreVisualProps> = ({ score, size = 'md' }) => {
  // Normalizar score entre 0-100
  const normalizedScore = Math.max(0, Math.min(100, score));

  // Determinar nível e cores
  const getLevel = (s: number) => {
    if (s <= 25) return { level: 'SEGURO', emoji: '🟢', color: 'text-green-500', bgColor: 'bg-green-500/20', borderColor: 'border-green-500' };
    if (s <= 50) return { level: 'MODERADO', emoji: '🟡', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500' };
    if (s <= 75) return { level: 'ALTO', emoji: '🟠', color: 'text-orange-500', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500' };
    return { level: 'CRÍTICO', emoji: '🔴', color: 'text-red-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500' };
  };

  const levelInfo = getLevel(normalizedScore);

  // Tamanhos
  const sizeConfig = {
    sm: { scoreSize: 'text-2xl', labelSize: 'text-xs', containerSize: 'w-24 h-24' },
    md: { scoreSize: 'text-4xl', labelSize: 'text-sm', containerSize: 'w-32 h-32' },
    lg: { scoreSize: 'text-6xl', labelSize: 'text-base', containerSize: 'w-48 h-48' },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center ${config.containerSize} rounded-full border-4 ${levelInfo.borderColor} ${levelInfo.bgColor} relative`}>
      {/* Barra de progresso circular */}
      <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-300 dark:text-gray-700"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={`${(normalizedScore / 100) * 2 * Math.PI * 45} ${2 * Math.PI * 45}`}
          className={levelInfo.color}
          strokeLinecap="round"
        />
      </svg>

      {/* Conteúdo central */}
      <div className="relative z-10 text-center">
        <div className={`${config.scoreSize} font-bold ${levelInfo.color}`}>
          {normalizedScore}
        </div>
        <div className={`${config.labelSize} font-semibold ${levelInfo.color} mt-1`}>
          {levelInfo.level}
        </div>
        <div className="text-2xl mt-2">{levelInfo.emoji}</div>
      </div>
    </div>
  );
};

// Componente auxiliar para exibir legenda
export const RiskScoreLegend: React.FC = () => {
  const levels = [
    { range: '0-25', level: 'SEGURO', emoji: '🟢', color: 'text-green-500' },
    { range: '26-50', level: 'MODERADO', emoji: '🟡', color: 'text-yellow-500' },
    { range: '51-75', level: 'ALTO', emoji: '🟠', color: 'text-orange-500' },
    { range: '76-100', level: 'CRÍTICO', emoji: '🔴', color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
      {levels.map((item) => (
        <div key={item.range} className="text-center">
          <div className="text-2xl mb-1">{item.emoji}</div>
          <div className={`text-xs font-bold ${item.color}`}>{item.level}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">{item.range}</div>
        </div>
      ))}
    </div>
  );
};

export default RiskScoreVisual;
