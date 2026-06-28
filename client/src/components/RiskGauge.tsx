import { useMemo } from 'react';

interface RiskGaugeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export function RiskGauge({ score, size = 'md' }: RiskGaugeProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const textSizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Calcular cor baseado no score
  const getColor = (s: number) => {
    if (s <= 30) return { fill: '#10b981', label: 'Baixo Risco', emoji: '🟢' }; // Verde
    if (s <= 60) return { fill: '#f59e0b', label: 'Médio Risco', emoji: '🟡' }; // Amarelo
    return { fill: '#ef4444', label: 'Alto Risco', emoji: '🔴' }; // Vermelho
  };

  const color = getColor(score);

  // Calcular ângulo do ponteiro (0-180 graus)
  const angle = (score / 100) * 180 - 90;

  // SVG para o gauge
  const gaugeRadius = 45;
  const strokeWidth = 8;
  const innerRadius = gaugeRadius - strokeWidth / 2;

  // Criar arco SVG
  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(50, 50, radius, endAngle);
    const end = polarToCartesian(50, 50, radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start} A ${radius} ${radius} 0 ${largeArc} 0 ${end}`;
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return [
      centerX + radius * Math.cos(angleInRadians),
      centerY + radius * Math.sin(angleInRadians),
    ];
  };

  // Arcos de cores
  const greenArc = createArc(0, 60, innerRadius);
  const yellowArc = createArc(60, 120, innerRadius);
  const redArc = createArc(120, 180, innerRadius);

  // Ponto do ponteiro
  const [pointerX, pointerY] = polarToCartesian(50, 50, innerRadius - 5, angle + 90);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg">
          {/* Fundo do gauge */}
          <circle cx="50" cy="50" r={gaugeRadius} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} />

          {/* Arcos coloridos */}
          <path d={greenArc} fill="none" stroke="#10b981" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={yellowArc} fill="none" stroke="#f59e0b" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={redArc} fill="none" stroke="#ef4444" strokeWidth={strokeWidth} strokeLinecap="round" />

          {/* Ponteiro */}
          <line
            x1="50"
            y1="50"
            x2={pointerX}
            y2={pointerY}
            stroke={color.fill}
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color.fill})`,
            }}
          />

          {/* Centro do ponteiro */}
          <circle cx="50" cy="50" r="4" fill={color.fill} />

          {/* Marcas de escala */}
          {[0, 30, 60, 100].map((mark, i) => {
            const markAngle = (mark / 100) * 180 - 90;
            const [x1, y1] = polarToCartesian(50, 50, innerRadius + 3, markAngle + 90);
            const [x2, y2] = polarToCartesian(50, 50, innerRadius + 8, markAngle + 90);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6b7280"
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Score no centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${textSizeClasses[size]} font-black text-white`}>{score}</div>
          <div className={`${labelSizeClasses[size]} text-gray-400`}>%</div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className={`text-lg font-bold ${
          score <= 30 ? 'text-green-400' :
          score <= 60 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {color.emoji} {color.label}
        </div>
      </div>
    </div>
  );
}
