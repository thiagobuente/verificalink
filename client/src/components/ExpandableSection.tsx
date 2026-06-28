/**
 * Componente ExpandableSection Reutilizável
 * Fornece animações suaves de entrada e saída para seções expansíveis
 */

import React, { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useExpandableAnimation } from '@/hooks/useExpandableAnimation';

interface ExpandableSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
}

/**
 * Seção expansível com animações suaves
 */
export function ExpandableSection({
  title,
  icon,
  children,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  onToggle,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const animation = useExpandableAnimation({
    isExpanded,
    onAnimationComplete: () => {
      // Callback opcional quando animação de saída completa
    },
  });

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <div className={`rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm ${className}`}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between hover:opacity-80 transition-opacity ${headerClassName}`}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-cyan-400">{icon}</div>}
          <h3 className="text-lg font-bold text-cyan-400 leading-tight">{title}</h3>
        </div>
        <div className="text-cyan-400 transition-transform duration-300">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Content */}
      {animation.shouldRender && (
        <div
          ref={animation.elementRef}
          className={`${animation.animationClass} mt-4 pt-4 border-t border-slate-700/50 ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Variante compacta de ExpandableSection
 */
interface CompactExpandableSectionProps extends Omit<ExpandableSectionProps, 'children'> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function CompactExpandableSection({
  title,
  icon,
  children,
  defaultOpen = false,
  className = '',
  size = 'md',
  onToggle,
}: CompactExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const animation = useExpandableAnimation({
    isExpanded,
  });

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`rounded-lg border border-slate-700/50 bg-slate-800/40 ${sizeClasses[size]} ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          {icon && <div className="text-slate-300">{icon}</div>}
          <h4 className="text-sm font-semibold text-slate-300 leading-tight">{title}</h4>
        </div>
        <div className="text-slate-400 transition-transform duration-300">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Content */}
      {animation.shouldRender && (
        <div
          ref={animation.elementRef}
          className={`${animation.animationClass} mt-2 pt-2 border-t border-slate-700/50`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Acordeão com múltiplas seções expansíveis
 */
interface AccordionItem {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  className = '',
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedItems);

    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      if (!allowMultiple) {
        newExpanded.clear();
      }
      newExpanded.add(id);
    }

    setExpandedItems(newExpanded);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <ExpandableSection
          key={item.id}
          title={item.title}
          icon={item.icon}
          defaultOpen={expandedItems.has(item.id)}
          onToggle={() => handleToggle(item.id)}
        >
          {item.content}
        </ExpandableSection>
      ))}
    </div>
  );
}
