/**
 * TabTransition - Componente para transições suaves entre abas
 * Implementa fade-in/fade-out com animações CSS
 */

import React, { ReactNode } from 'react';

interface TabTransitionProps {
  children: ReactNode;
  isActive: boolean;
  duration?: number; // em ms
}

export function TabTransition({ children, isActive, duration = 300 }: TabTransitionProps) {
  return (
    <div
      style={{
        animation: isActive
          ? `fadeInTab ${duration}ms ease-out forwards`
          : `fadeOutTab ${duration}ms ease-in forwards`,
        pointerEvents: isActive ? 'auto' : 'none',
      }}
      className="w-full"
    >
      <style>{`
        @keyframes fadeInTab {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeOutTab {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeInTab {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeOutTab {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
        }
      `}</style>
      {children}
    </div>
  );
}

/**
 * TabContainer - Wrapper para múltiplas abas com transições
 */
interface TabContainerProps {
  activeTab: string;
  tabs: {
    id: string;
    content: ReactNode;
  }[];
  duration?: number;
}

export function TabContainer({ activeTab, tabs, duration = 300 }: TabContainerProps) {
  return (
    <div className="relative w-full">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            display: activeTab === tab.id ? 'block' : 'none',
          }}
        >
          <TabTransition isActive={activeTab === tab.id} duration={duration}>
            {tab.content}
          </TabTransition>
        </div>
      ))}
    </div>
  );
}
