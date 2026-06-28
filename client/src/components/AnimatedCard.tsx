/**
 * Componente AnimatedCard Reutilizável
 * Fornece animações de entrada fade-in/slide-up para cards
 */

import React, { ReactNode } from 'react';
import { useCardAnimation } from '@/hooks/useCardAnimation';

interface AnimatedCardProps {
  children: ReactNode;
  trigger?: boolean;
  staggerIndex?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Card com animação de entrada fade-in-up
 */
export function AnimatedCard({
  children,
  trigger = true,
  staggerIndex = 0,
  delay = 0,
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
}: AnimatedCardProps) {
  const animation = useCardAnimation({
    triggerAnimation: trigger,
    delay,
    staggerIndex,
  });

  return (
    <div
      ref={animation.elementRef}
      className={`${animation.animationClass} ${animation.staggerClass} ${className}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

/**
 * Container para múltiplos cards com animação em cascata
 */
interface AnimatedCardGridProps {
  children: ReactNode;
  trigger?: boolean;
  columns?: number;
  gap?: number;
  className?: string;
}

export function AnimatedCardGrid({
  children,
  trigger = true,
  columns = 3,
  gap = 16,
  className = '',
}: AnimatedCardGridProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${280}px, 1fr))`,
        gap: `${gap}px`,
        margin: '20px 0',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Componente de resultado com animação
 */
interface AnimatedResultProps {
  children: ReactNode;
  trigger?: boolean;
  staggerIndex?: number;
  className?: string;
}

export function AnimatedResult({
  children,
  trigger = true,
  staggerIndex = 0,
  className = '',
}: AnimatedResultProps) {
  const animation = useCardAnimation({
    triggerAnimation: trigger,
    staggerIndex,
  });

  return (
    <div
      ref={animation.elementRef}
      className={`${animation.animationClass} ${animation.staggerClass} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Componente para animar lista de itens
 */
interface AnimatedListProps {
  items: ReactNode[];
  trigger?: boolean;
  className?: string;
  itemClassName?: string;
}

export function AnimatedList({
  items,
  trigger = true,
  className = 'space-y-2',
  itemClassName = '',
}: AnimatedListProps) {
  return (
    <div className={className}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`animate-fade-in-up animate-stagger-${Math.min(idx + 1, 5)} ${itemClassName}`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
