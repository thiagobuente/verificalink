import React from 'react';
import { Database, Lock, Shield, Zap } from 'lucide-react';
import { InstallPWAButton } from './InstallPWAButton';

const heroStyles = `
  .hero-wrapper {
    width: 100%;
    background: linear-gradient(to bottom right, #0f172a, #0f1419, #0f172a);
    position: relative;
    overflow: hidden;
    padding: 48px 24px;
  }

  .hero-bg-grid {
    position: absolute;
    inset: 0;
    opacity: 0.1;
    background-image: 
      linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
      linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  .hero-glow {
    position: absolute;
    border-radius: 9999px;
    mix-blend-mode: multiply;
    filter: blur(96px);
    opacity: 0.05;
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .hero-glow-top {
    top: 0;
    right: 0;
    width: 384px;
    height: 384px;
    background-color: #06b6d4;
  }

  .hero-glow-bottom {
    bottom: 0;
    left: 0;
    width: 384px;
    height: 384px;
    background-color: #3b82f6;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.05; }
    50% { opacity: 0.1; }
  }

  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 10;
    gap: 32px;
  }

  .hero-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    width: 100%;
    flex-wrap: wrap;
  }

  .hero-logo {
    width: 90px;
    max-width: 90px;
    height: auto;
    color: #06b6d4;
    flex-shrink: 0;
  }

  .hero-title {
    margin: 0;
    text-align: center;
    font-size: clamp(3rem, 6vw, 5rem);
    font-weight: 800;
    color: #06b6d4;
    line-height: 1.2;
  }

  .hero-subtitle {
    color: #d1d5db;
    font-size: clamp(1rem, 2vw, 1.125rem);
    margin: 0;
    max-width: 800px;
    line-height: 1.6;
    font-weight: 500;
  }

  .hero-credentials {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 600px;
  }

  .hero-credential-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(6, 182, 212, 0.05);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 6px;
    color: #d1d5db;
    font-size: clamp(0.875rem, 1.5vw, 1rem);
    line-height: 1.4;
  }

  .hero-credential-check {
    color: #06b6d4;
    font-weight: bold;
    flex-shrink: 0;
    font-size: 1.2em;
  }

  .hero-seal {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 24px;
    border-radius: 8px;
    background: transparent;
    border: none;
    cursor: default;
  }

  .hero-seal-icon {
    color: #06b6d4;
    flex-shrink: 0;
  }

  .hero-seal-text {
    color: #ffffff;
    font-weight: 600;
    font-size: clamp(0.875rem, 1.5vw, 1.125rem);
    text-align: center;
    line-height: 1.4;
  }

  .hero-sources {
    width: 100%;
    max-width: 1000px;
    padding: 24px 32px;
    background: rgba(6, 182, 212, 0.05);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 8px;
  }

  .hero-sources-title {
    color: #06b6d4;
    font-weight: 700;
    font-size: clamp(0.875rem, 1.5vw, 1rem);
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hero-sources-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
    justify-content: center;
  }

  .hero-sources-item {
    color: #d1d5db;
    font-size: clamp(0.75rem, 1.2vw, 0.875rem);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .hero-sources-separator {
    color: #4b5563;
  }

  .hero-sources-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 0;
    padding: 0;
    justify-content: center;
    align-items: center;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 14px;
    background: rgba(34, 211, 238, 0.08);
    border: 1px solid rgba(34, 211, 238, 0.25);
    border-radius: 20px;
    color: #22d3ee;
    font-size: clamp(0.7rem, 1vw, 0.85rem);
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.3s ease;
  }

  .hero-badge:hover {
    background: rgba(34, 211, 238, 0.15);
    border-color: rgba(34, 211, 238, 0.4);
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
  }

  .hero-stats {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
  }

  .hero-stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(34, 211, 238, 0.05);
    border: 1px solid rgba(34, 211, 238, 0.15);
    border-radius: 12px;
    color: #d1d5db;
    font-size: clamp(0.85rem, 1.2vw, 1rem);
    font-weight: 500;
  }

  .hero-stat-icon {
    font-size: 1.3em;
  }

  .hero-stat-text {
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .hero-wrapper {
      padding: 32px 16px;
    }

    .hero-container {
      gap: 24px;
    }

    .hero-brand {
      flex-direction: column;
      gap: 12px;
    }

    .hero-logo {
      width: 80px;
      max-width: 80px;
    }

    .hero-title {
      font-size: 2rem;
      line-height: 1.1;
    }

    .hero-credentials {
      gap: 10px;
    }

    .hero-credential-item {
      padding: 10px 12px;
      font-size: 0.8rem;
    }

    .hero-seal {
      padding: 12px 16px;
      gap: 8px;
    }

    .hero-seal-icon {
      width: 20px;
      height: 20px;
    }

    .hero-seal-text {
      font-size: 0.875rem;
    }

    .hero-sources {
      padding: 16px 20px;
    }

    .hero-sources-list {
      gap: 6px;
    }

    .hero-sources-item {
      font-size: 0.7rem;
    }

    .hero-logo-large {
      width: 200px;
      height: 200px;
    }

    .hero-glow {
      width: 256px !important;
      height: 256px !important;
    }
  }

  @media (max-width: 480px) {
    .hero-wrapper {
      padding: 24px 12px;
    }

    .hero-container {
      gap: 16px;
    }

    .hero-logo {
      width: 70px;
      max-width: 70px;
    }

    .hero-title {
      font-size: 1.5rem;
    }

    .hero-subtitle {
      font-size: 0.875rem;
    }

    .hero-credentials {
      gap: 8px;
    }

    .hero-credential-item {
      padding: 8px 10px;
      font-size: 0.75rem;
    }

    .hero-seal {
      padding: 10px 12px;
    }

    .hero-sources {
      padding: 12px 16px;
    }

    .hero-sources-list {
      gap: 4px;
    }

    .hero-sources-item {
      font-size: 0.65rem;
    }

    .hero-logo-large {
      width: 160px;
      height: 160px;
    }
  }
`;

export const ThreatIntelligenceHero: React.FC = () => {
  return (
    <>
      <style>{heroStyles}</style>
      <div className="hero-wrapper">
        {/* Background Grid Effect */}
        <div className="hero-bg-grid" />

        {/* Glow Elements */}
        <div className="hero-glow hero-glow-top" />
        <div className="hero-glow hero-glow-bottom" />

        {/* HERO CONTAINER */}
        <div className="hero-container">
          
          {/* HEADER: LOGO + TÍTULO */}
          <div className="hero-brand">
            <Shield className="hero-logo" size={90} strokeWidth={1.5} />
            <h1 className="hero-title">Shield Security Scanner</h1>
          </div>

          {/* SUBTÍTULO - MAIS FORTE */}
          <p className="hero-subtitle">
            Detecte golpes, phishing e ameaças digitais antes do clique.
          </p>

          {/* SCORE GLOBAL DA PLATAFORMA */}
          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-icon">🛡️</span>
              <span className="hero-stat-text">14 Fontes Integradas</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-icon">⚡</span>
              <span className="hero-stat-text">Análise em Tempo Real</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-icon">🔒</span>
              <span className="hero-stat-text">Privacidade Preservada</span>
            </div>
          </div>

          {/* INSTALL PWA BUTTON */}
          <div className="mt-6">
            <InstallPWAButton />
          </div>

        </div>
      </div>
    </>
  );
};
