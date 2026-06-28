/**
 * Tools Navigation - Navegação Compacta com Cards Glassmorphism
 * Design: SOC/Threat Intelligence Panel - REFINADO E LIMPO
 */

import React from 'react';
import { Link2, QrCode, FileText, Mail, Image as ImageIcon, Search, Info } from 'lucide-react';

interface ToolItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tabName: string;
}

interface ToolsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TOOLS: ToolItem[] = [
  {
    id: 'link',
    icon: <Link2 className="w-6 h-6" />,
    title: 'Link',
    description: 'Analisar URLs',
    tabName: 'link',
  },
  {
    id: 'qrcode',
    icon: <QrCode className="w-6 h-6" />,
    title: 'QR Code',
    description: 'Verificar QR',
    tabName: 'qrcode',
  },
  {
    id: 'pdf',
    icon: <FileText className="w-6 h-6" />,
    title: 'PDF',
    description: 'Analisar arquivos',
    tabName: 'pdf',
  },
  {
    id: 'email',
    icon: <Mail className="w-6 h-6" />,
    title: 'Email',
    description: 'Verificar remetentes',
    tabName: 'email',
  },
  {
    id: 'screenshot',
    icon: <ImageIcon className="w-6 h-6" />,
    title: 'Screenshot',
    description: 'Analisar capturas',
    tabName: 'screenshot',
  },
  {
    id: 'ioc',
    icon: <Search className="w-6 h-6" />,
    title: 'IOC',
    description: 'Investigar indicadores',
    tabName: 'ioc',
  },
  {
    id: 'sobre',
    icon: <Info className="w-6 h-6" />,
    title: 'Sobre',
    description: 'Informações da plataforma',
    tabName: 'sobre',
  },
];

export function ToolsNavigation({ activeTab, onTabChange }: ToolsNavigationProps) {
  return (
    <div className="w-full py-4 px-4">
      {/* Grid de Cards Compactos */}
      <div className="max-w-6xl mx-auto">
        <style>{`
          .tool-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin: 0;
          }

          .tool-card {
            min-height: 110px;
            padding: 22px 24px;
            border-radius: 18px;
            background: rgba(10, 15, 40, 0.55);
            border: 1px solid rgba(34, 211, 238, 0.22);
            box-shadow: 0 0 14px rgba(34, 211, 238, 0.10);
            display: flex;
            align-items: center;
            gap: 18px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            color: inherit;
            font-family: inherit;
            border: none;
            width: 100%;
            position: relative;
          }

          .tool-card:hover:not(.active) {
            transform: translateY(-2px);
            border-color: rgba(34, 211, 238, 0.35);
            box-shadow: 0 0 22px rgba(34, 211, 238, 0.15);
            background: rgba(10, 15, 40, 0.65);
          }

          .tool-card.active {
            background: rgba(34, 211, 238, 0.12);
            border: 1px solid #22d3ee;
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.25);
            position: relative;
          }

          .tool-card.active::after {
            content: '● ATIVO';
            position: absolute;
            top: 8px;
            right: 12px;
            font-size: 0.7rem;
            font-weight: 700;
            color: #22d3ee;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .tool-card:active {
            transform: scale(0.98);
          }

          .tool-card-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(34, 211, 238, 0.08);
            color: #22d3ee;
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .tool-card.active .tool-card-icon {
            background: rgba(34, 211, 238, 0.15);
            color: #22d3ee;
          }

          .tool-card:hover:not(.active) .tool-card-icon {
            background: rgba(34, 211, 238, 0.12);
          }

          .tool-card-content {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
          }

          .tool-card-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #e2e8f0;
            margin: 0;
            line-height: 1.3;
            white-space: normal;
            overflow: visible;
            word-break: break-word;
          }

          .tool-card-description {
            font-size: 0.82rem;
            color: rgba(226, 232, 240, 0.65);
            margin: 0;
            line-height: 1.4;
            white-space: normal;
            overflow: visible;
            word-break: break-word;
          }

          .tool-card.active .tool-card-title {
            color: #22d3ee;
          }

          .tool-card.active .tool-card-description {
            color: rgba(34, 211, 238, 0.85);
          }

          .tool-card-indicator {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #22d3ee;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .tool-card.active .tool-card-indicator {
            opacity: 1;
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

          /* Mobile até 768px - 1 coluna com cards horizontais */
          @media (max-width: 768px) {
            .tool-grid {
              grid-template-columns: 1fr !important;
              gap: 12px;
            }

            .tool-card {
              width: 100%;
              min-height: 72px;
              max-height: none;
              padding: 14px 16px;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              gap: 14px;
            }

            .tool-card-icon {
              width: 40px;
              height: 40px;
              flex-shrink: 0;
            }

            .tool-card-content {
              display: flex;
              flex-direction: column;
              gap: 3px;
              flex: 1;
              min-width: 0;
            }

            .tool-card-title {
              font-size: 0.95rem;
              line-height: 1.2;
              white-space: normal !important;
              overflow: visible !important;
              text-overflow: unset !important;
              word-break: normal !important;
            }

            .tool-card-description {
              font-size: 0.78rem;
              line-height: 1.3;
              white-space: normal !important;
              overflow: visible !important;
              text-overflow: unset !important;
              word-break: normal !important;
            }
          }

          /* Tablet (769px - 1024px) - 3 colunas */
          @media (min-width: 769px) and (max-width: 1024px) {
            .tool-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
          }

          /* Desktop (acima de 1024px) - 4 colunas */
          @media (min-width: 1025px) {
            .tool-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 14px;
            }
          }
        `}</style>

        <div className="tool-grid">
          {TOOLS.map((tool) => {
            const isActive = activeTab === tool.tabName;

            return (
              <button
                key={tool.id}
                onClick={() => onTabChange(tool.tabName)}
                className={`tool-card ${isActive ? 'active' : ''}`}
              >
                <div className="tool-card-icon">{tool.icon}</div>
                <div className="tool-card-content">
                  <h3 className="tool-card-title">{tool.title}</h3>
                  <p className="tool-card-description">{tool.description}</p>
                </div>
                {isActive && <div className="tool-card-indicator" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Linha divisória suave */}
      <div
        className="mt-6 mx-auto max-w-6xl"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.15), transparent)',
        }}
      />
    </div>
  );
}
