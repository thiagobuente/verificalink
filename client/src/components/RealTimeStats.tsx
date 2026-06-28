import React, { useEffect, useState } from "react";
import { Search, Shield, AlertTriangle, Globe } from "lucide-react";
import { useStatisticsTracker } from "@/hooks/useStatisticsTracker";

export interface StatItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: "blue" | "green" | "red" | "purple" | "cyan";
}

interface RealTimeStatsProps {
  stats?: StatItem[];
  title?: string;
  subtitle?: string;
}

/**
 * Componente de contador animado
 */
function AnimatedCounter({
  value,
  suffix = "",
  duration = 2000,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;

      if (progress < 1) {
        setDisplayValue(Math.floor(value * progress));
        animationId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [value, duration]);

  return (
    <>
      {displayValue.toLocaleString("pt-BR")}
      {suffix}
    </>
  );
}

/**
 * Componente de Estatísticas em Tempo Real
 */
export function RealTimeStats({
  stats: customStats,
  title = "📊 Estatísticas em Tempo Real",
  subtitle = "Plataforma ativa protegendo usuários",
}: RealTimeStatsProps) {
  const { stats: trackedStats, isLoading } = useStatisticsTracker();

  // Usar estatísticas rastreadas em tempo real
  const stats = customStats || [
    {
      id: "analyses",
      icon: <Search className="w-8 h-8" />,
      label: "Análises Realizadas",
      value: trackedStats.totalAnalyses,
      color: "blue" as const,
    },
    {
      id: "threats",
      icon: <AlertTriangle className="w-8 h-8" />,
      label: "Ameaças Identificadas",
      value: trackedStats.threatsIdentified,
      color: "red" as const,
    },
    {
      id: "malicious",
      icon: <Shield className="w-8 h-8" />,
      label: "URLs Maliciosas Detectadas",
      value: trackedStats.maliciousURLs,
      color: "purple" as const,
    },
    {
      id: "sources",
      icon: <Globe className="w-8 h-8" />,
      label: "Fontes de Inteligência",
      value: trackedStats.intelligenceSources,
      color: "cyan" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="realtime-stats-container w-full">
        <div className="text-center text-gray-500">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div className="realtime-stats-container w-full">
      {/* Header */}
      <div className="realtime-stats-header text-center mb-12">
        <h2 className="realtime-stats-title text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="realtime-stats-subtitle text-gray-600 dark:text-gray-400 text-lg">
            {subtitle}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="realtime-stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className={`realtime-stat-card stat-color-${stat.color}`}
            style={{
              animation: `slideInUp 0.6s ease-out ${index * 0.1}s backwards`,
            }}
          >
            {/* Icon Container */}
            <div className={`realtime-stat-icon-container icon-${stat.color}`}>
              {stat.icon}
            </div>

            {/* Content */}
            <div className="realtime-stat-content">
              {/* Value */}
              <div className={`realtime-stat-value value-${stat.color}`}>
                <AnimatedCounter
                  value={stat.value}
                  suffix={(stat as StatItem).suffix}
                  duration={2000}
                />
              </div>

              {/* Label */}
              <div className="realtime-stat-label">{stat.label}</div>
            </div>

            {/* Pulse Effect */}
            <div className={`realtime-stat-pulse pulse-${stat.color}`}></div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="realtime-stats-footer mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 Estatísticas atualizadas em tempo real • Dados de todas as análises realizadas na plataforma
        </p>
      </div>
    </div>
  );
}

/**
 * Estatísticas padrão para Shield Security Scanner
 * NOTA: Estes valores são sobrescritos pelos dados reais do useStatisticsTracker
 */
export const DEFAULT_STATS: StatItem[] = [
  {
    id: "analyses",
    icon: <Search className="w-8 h-8" />,
    label: "Análises Realizadas",
    value: 0,
    color: "blue",
  },
  {
    id: "threats",
    icon: <AlertTriangle className="w-8 h-8" />,
    label: "Ameaças Identificadas",
    value: 0,
    color: "red",
  },
  {
    id: "malicious",
    icon: <Shield className="w-8 h-8" />,
    label: "URLs Maliciosas Detectadas",
    value: 0,
    color: "purple",
  },
  {
    id: "sources",
    icon: <Globe className="w-8 h-8" />,
    label: "Fontes de Inteligência",
    value: 14,
    color: "cyan",
  },
];
