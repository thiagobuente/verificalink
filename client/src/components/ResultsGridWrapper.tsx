/**
 * ResultsGridWrapper - Wrapper para integrar ResponsiveResultsGrid em analisadores existentes
 * Facilita a aplicação de grid responsivo sem reescrever componentes
 */

import React, { ReactNode } from 'react';
import { ResponsiveResultsGrid, ResultCard } from './ResponsiveResultsGrid';

interface ResultsGridWrapperProps {
  results: Array<{
    id: string;
    icon?: ReactNode;
    title: string;
    value: string | ReactNode;
    status?: 'safe' | 'warning' | 'danger' | 'neutral';
    description?: string;
    onClick?: () => void;
  }>;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  isLoading?: boolean;
}

export function ResultsGridWrapper({
  results,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 14,
  isLoading = false,
}: ResultsGridWrapperProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <ResponsiveResultsGrid columns={columns} gap={gap}>
      {results.map((result) => (
        <ResultCard
          key={result.id}
          icon={result.icon}
          title={result.title}
          value={result.value}
          status={result.status}
          description={result.description}
          onClick={result.onClick}
        />
      ))}
    </ResponsiveResultsGrid>
  );
}

/**
 * QuickStatsGrid - Grid para estatísticas rápidas
 */
interface QuickStatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'cyan' | 'green' | 'yellow' | 'red';
}

export function QuickStatsGrid({ stats }: { stats: QuickStatProps[] }) {
  const colorMap = {
    cyan: { bg: 'rgba(34, 211, 238, 0.1)', border: 'rgba(34, 211, 238, 0.25)', text: '#22d3ee' },
    green: { bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', text: '#00ff88' },
    yellow: { bg: 'rgba(255, 204, 0, 0.1)', border: 'rgba(255, 204, 0, 0.3)', text: '#ffcc00' },
    red: { bg: 'rgba(255, 68, 68, 0.1)', border: 'rgba(255, 68, 68, 0.3)', text: '#ff4444' },
  };

  return (
    <div className="quick-stats-grid">
      <style>{`
        .quick-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }

        .quick-stat-item {
          padding: 16px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          transition: all 300ms ease-out;
        }

        .quick-stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 16px rgba(34, 211, 238, 0.2);
        }

        .quick-stat-icon {
          font-size: 1.5rem;
        }

        .quick-stat-label {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .quick-stat-value {
          font-size: 1.3rem;
          font-weight: 700;
        }

        @media (max-width: 480px) {
          .quick-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 12px 0;
          }

          .quick-stat-item {
            padding: 12px;
          }

          .quick-stat-value {
            font-size: 1.1rem;
          }
        }
      `}</style>

      {stats.map((stat, idx) => {
        const colors = colorMap[stat.color || 'cyan'];
        return (
          <div
            key={idx}
            className="quick-stat-item"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
          >
            {stat.icon && <div className="quick-stat-icon">{stat.icon}</div>}
            <div className="quick-stat-label">{stat.label}</div>
            <div className="quick-stat-value" style={{ color: colors.text }}>
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * AnalysisMetrics - Componente para exibir métricas de análise
 */
interface AnalysisMetricsProps {
  riskLevel: number; // 0-100
  confidence: number; // 0-100
  sourcesCount: number;
  analysisTime?: number; // em ms
}

export function AnalysisMetrics({
  riskLevel,
  confidence,
  sourcesCount,
  analysisTime,
}: AnalysisMetricsProps) {
  const getRiskColor = (level: number) => {
    if (level < 20) return 'green';
    if (level < 50) return 'yellow';
    if (level < 80) return 'red';
    return 'red';
  };

  return (
    <QuickStatsGrid
      stats={[
        {
          label: 'Nível de Risco',
          value: `${riskLevel}%`,
          icon: '⚠️',
          color: getRiskColor(riskLevel),
        },
        {
          label: 'Confiança',
          value: `${confidence}%`,
          icon: '✓',
          color: confidence > 80 ? 'green' : 'yellow',
        },
        {
          label: 'Fontes',
          value: sourcesCount,
          icon: '🔍',
          color: 'cyan',
        },
        ...(analysisTime
          ? [
              {
                label: 'Tempo',
                value: `${analysisTime}ms`,
                icon: '⏱️',
                color: 'cyan' as const,
              },
            ]
          : []),
      ]}
    />
  );
}
