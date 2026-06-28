/**
 * SkeletonLoader - Componentes de carregamento animados
 * Skeleton loaders profissionais para melhor UX durante análises
 */

import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
  lines?: number;
}

/**
 * Skeleton básico - barra de carregamento
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  circle = false,
  className = '',
}: SkeletonLoaderProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '8px',
      }}
      className={`skeleton-loader ${className}`}
    >
      <style>{`
        .skeleton-loader {
          background: linear-gradient(
            90deg,
            rgba(34, 211, 238, 0.1) 25%,
            rgba(34, 211, 238, 0.2) 50%,
            rgba(34, 211, 238, 0.1) 75%
          );
          background-size: 200% 100%;
          animation: skeletonShimmer 2s infinite;
        }

        @keyframes skeletonShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-loader {
            animation: none;
            background: rgba(34, 211, 238, 0.15);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Card skeleton - para simular card de resultado
 */
export function SkeletonCard({ count = 1 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4">
      <style>{`
        .skeleton-card {
          background: rgba(10, 15, 40, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.25);
          border-radius: 16px;
          padding: 16px;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-card-header {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .skeleton-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .skeleton-card-title {
          flex: 1;
          height: 20px;
        }

        .skeleton-card-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-card-value {
          height: 24px;
          width: 60%;
        }

        .skeleton-card-description {
          height: 16px;
          width: 80%;
        }
      `}</style>

      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-header">
            <Skeleton circle width="40px" height="40px" className="skeleton-card-icon" />
            <Skeleton width="100%" height="20px" className="skeleton-card-title" />
          </div>
          <div className="skeleton-card-content">
            <Skeleton width="60%" height="24px" className="skeleton-card-value" />
            <Skeleton width="80%" height="16px" className="skeleton-card-description" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Grid skeleton - para simular grid de cards
 */
export function SkeletonGrid({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div className="skeleton-grid">
      <style>{`
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 14px;
          margin: 18px 0;
        }

        @media (max-width: 480px) {
          .skeleton-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin: 12px 0;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .skeleton-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin: 14px 0;
          }
        }

        .skeleton-grid-item {
          background: rgba(10, 15, 40, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.25);
          border-radius: 16px;
          padding: 16px;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>

      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-grid-item">
          <Skeleton width="80%" height="20px" />
          <Skeleton width="100%" height="24px" />
          <Skeleton width="60%" height="16px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Text skeleton - para simular texto
 */
export function SkeletonText({ lines = 3 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-3">
      <style>{`
        .skeleton-text-line {
          height: 16px;
          border-radius: 4px;
        }

        .skeleton-text-line.last {
          width: 80%;
        }
      `}</style>

      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width="100%"
          height="16px"
          className={i === lines - 1 ? 'skeleton-text-line last' : 'skeleton-text-line'}
        />
      ))}
    </div>
  );
}

/**
 * Analysis skeleton - para simular análise completa
 */
export function SkeletonAnalysis() {
  return (
    <div className="space-y-6">
      <style>{`
        .skeleton-analysis-header {
          background: rgba(10, 15, 40, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.25);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .skeleton-analysis-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .skeleton-analysis-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>

      {/* Header */}
      <div className="skeleton-analysis-header">
        <Skeleton circle width="60px" height="60px" className="skeleton-analysis-icon" />
        <div className="skeleton-analysis-content" style={{ flex: 1 }}>
          <Skeleton width="40%" height="24px" />
          <Skeleton width="60%" height="16px" />
          <Skeleton width="50%" height="16px" />
        </div>
      </div>

      {/* Cards */}
      <SkeletonGrid count={3} />

      {/* Details */}
      <div style={{ background: 'rgba(10, 15, 40, 0.45)', borderRadius: '16px', padding: '20px' }}>
        <Skeleton width="30%" height="20px" />
        <div style={{ marginTop: '16px' }}>
          <SkeletonText lines={4} />
        </div>
      </div>
    </div>
  );
}

/**
 * Pulse animation - para elementos que precisam de destaque
 */
export function SkeletonPulse({ children }: { children: React.ReactNode }) {
  return (
    <div className="skeleton-pulse">
      <style>{`
        .skeleton-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-pulse {
            animation: none;
            opacity: 0.75;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
