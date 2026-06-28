/**
 * Hook para gerenciar animações de entrada de cards
 * Fornece classes de animação baseadas em estado e índice
 */

import { useEffect, useRef, useState } from 'react';

interface UseCardAnimationOptions {
  triggerAnimation?: boolean;
  delay?: number;
  staggerIndex?: number;
}

export function useCardAnimation({
  triggerAnimation = true,
  delay = 0,
  staggerIndex = 0,
}: UseCardAnimationOptions = {}) {
  const [isVisible, setIsVisible] = useState(!triggerAnimation);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerAnimation) {
      setIsVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay + staggerIndex * 100);

    return () => clearTimeout(timer);
  }, [triggerAnimation, delay, staggerIndex]);

  return {
    elementRef,
    isVisible,
    animationClass: isVisible ? 'animate-fade-in-up' : 'opacity-0',
    staggerClass: `animate-stagger-${Math.min(staggerIndex + 1, 5)}`,
  };
}

/**
 * Hook para gerenciar animações em cascata para múltiplos elementos
 */
export function useCascadeAnimation(itemCount: number, trigger: boolean = true) {
  return Array.from({ length: itemCount }, (_, index) =>
    useCardAnimation({
      triggerAnimation: trigger,
      staggerIndex: index,
    })
  );
}
