/**
 * ResponsiveResultsGrid - Grid responsivo para cards de resultado
 * Otimizado para mobile, tablet e desktop
 */

import React, { ReactNode, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ResponsiveResultsGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number; // até 480px
    tablet?: number; // 481px - 1024px
    desktop?: number; // acima de 1024px
  };
  gap?: number; // em pixels
}

export function ResponsiveResultsGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 14,
}: ResponsiveResultsGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: `${gap}px`,
      }}
      className="results-grid"
    >
      <style>{`
        .results-grid {
          display: grid;
          gap: ${gap}px;
          margin: 18px 0;
        }

        /* Mobile pequeno (até 480px) */
        @media (max-width: 480px) {
          .results-grid {
            grid-template-columns: repeat(${columns.mobile || 1}, 1fr);
            gap: ${gap - 4}px;
            margin: 12px 0;
          }
        }

        /* Mobile médio (481px - 768px) */
        @media (min-width: 481px) and (max-width: 768px) {
          .results-grid {
            grid-template-columns: repeat(${columns.tablet || 2}, 1fr);
            gap: ${gap - 2}px;
            margin: 14px 0;
          }
        }

        /* Tablet (769px - 1024px) */
        @media (min-width: 769px) and (max-width: 1024px) {
          .results-grid {
            grid-template-columns: repeat(${columns.tablet || 2}, 1fr);
            gap: ${gap}px;
            margin: 16px 0;
          }
        }

        /* Desktop (acima de 1024px) */
        @media (min-width: 1025px) {
          .results-grid {
            grid-template-columns: repeat(${columns.desktop || 3}, 1fr);
            gap: ${gap}px;
            margin: 18px 0;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

/**
 * ResultCard - Card otimizado para grid responsivo
 */
interface ResultCardProps {
  icon?: ReactNode;
  title: string;
  value: string | ReactNode;
  status?: 'safe' | 'warning' | 'danger' | 'neutral';
  description?: string;
  onClick?: () => void;
}

export function ResultCard({
  icon,
  title,
  value,
  status = 'neutral',
  description,
  onClick,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = typeof value === 'string' ? value : String(value);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const statusColors = {
    safe: {
      bg: 'rgba(0, 255, 136, 0.1)',
      border: 'rgba(0, 255, 136, 0.3)',
      text: '#00ff88',
    },
    warning: {
      bg: 'rgba(255, 204, 0, 0.1)',
      border: 'rgba(255, 204, 0, 0.3)',
      text: '#ffcc00',
    },
    danger: {
      bg: 'rgba(255, 68, 68, 0.1)',
      border: 'rgba(255, 68, 68, 0.3)',
      text: '#ff4444',
    },
    neutral: {
      bg: 'rgba(34, 211, 238, 0.1)',
      border: 'rgba(34, 211, 238, 0.25)',
      text: '#22d3ee',
    },
  };

  const colors = statusColors[status];

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
      className="result-card p-4 rounded-lg backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1 relative group"
    >
      <style>{`
        .result-card {
          min-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .result-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .result-card-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .result-card-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        .result-card-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: ${colors.text};
          margin: 4px 0;
          word-break: break-word;
        }

        .result-card-description {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 4px 0 0 0;
        }

        .result-card-copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(34, 211, 238, 0.2);
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          opacity: 0;
          transition: all 200ms ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .result-card:hover .result-card-copy-btn {
          opacity: 1;
        }

        .result-card-copy-btn:hover {
          background: rgba(34, 211, 238, 0.4);
          border-color: rgba(34, 211, 238, 0.6);
        }

        .result-card-copy-btn svg {
          width: 16px;
          height: 16px;
          color: #22d3ee;
        }

        @media (max-width: 480px) {
          .result-card {
            min-height: 90px;
            padding: 12px;
          }

          .result-card-title {
            font-size: 0.85rem;
          }

          .result-card-value {
            font-size: 1rem;
          }

          .result-card-description {
            font-size: 0.75rem;
          }
        }
      `}</style>

      <button
        onClick={handleCopy}
        className="result-card-copy-btn"
        title="Copiar para a área de transferência"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>

      {icon && (
        <div className="result-card-header">
          <div className="result-card-icon">{icon}</div>
          <p className="result-card-title">{title}</p>
        </div>
      )}
      {!icon && <p className="result-card-title">{title}</p>}

      <div className="result-card-value">{value}</div>

      {description && <p className="result-card-description">{description}</p>}
    </div>
  );
}
