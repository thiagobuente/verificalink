import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animationType?: 'fade-in' | 'fade-in-up' | 'fade-in-down' | 'fade-in-left' | 'fade-in-right' | 'scale-in' | 'slide-in-up' | 'bounce-in';
  delay?: number;
}

/**
 * Componente que aplica animações de entrada quando a seção entra em viewport
 */
export function AnimatedSection({
  children,
  className = '',
  animationType = 'fade-in-up',
  delay = 0,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  const animationClass = `${animationType}-on-scroll`;
  const visibleClass = isVisible ? 'visible' : '';

  return (
    <div
      ref={ref}
      className={`${className} ${animationClass} ${visibleClass}`}
      style={{
        animationDelay: isVisible ? `${delay}s` : '0s',
      }}
    >
      {children}
    </div>
  );
}
