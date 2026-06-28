/**
 * Hook para gerenciar animações de entrada e saída de seções expansíveis
 * Fornece classes de animação baseadas em estado de expansão
 */

import { useEffect, useRef, useState } from 'react';

interface UseExpandableAnimationOptions {
  isExpanded: boolean;
  onAnimationComplete?: () => void;
}

export function useExpandableAnimation({
  isExpanded,
  onAnimationComplete,
}: UseExpandableAnimationOptions) {
  const [animationClass, setAnimationClass] = useState('');
  const [isVisible, setIsVisible] = useState(isExpanded);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isExpanded) {
      // Entrada
      setIsVisible(true);
      setAnimationClass('animate-fade-in-up');
    } else {
      // Saída
      setAnimationClass('animate-fade-out-down');

      // Aguardar animação de saída antes de remover do DOM
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        onAnimationComplete?.();
      }, 400); // Duração da animação de saída (0.4s)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isExpanded, onAnimationComplete]);

  return {
    elementRef,
    isVisible,
    animationClass,
    shouldRender: isVisible,
  };
}

/**
 * Hook para gerenciar animações de múltiplas seções expansíveis
 */
interface ExpandableSection {
  [key: string]: boolean;
}

export function useMultipleExpandableAnimation(sections: ExpandableSection) {
  const animations = Object.entries(sections).reduce(
    (acc, [key, isExpanded]) => {
      acc[key] = useExpandableAnimation({
        isExpanded,
      });
      return acc;
    },
    {} as Record<string, ReturnType<typeof useExpandableAnimation>>
  );

  return animations;
}

/**
 * Hook para gerenciar animação de conteúdo que colapsa/expande
 */
interface UseCollapseAnimationOptions {
  isOpen: boolean;
  duration?: number;
}

export function useCollapseAnimation({
  isOpen,
  duration = 300,
}: UseCollapseAnimationOptions) {
  const [animationClass, setAnimationClass] = useState('');
  const [isRendered, setIsRendered] = useState(isOpen);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isOpen) {
      setIsRendered(true);
      // Pequeno delay para garantir que o elemento está no DOM antes de animar
      setTimeout(() => {
        setAnimationClass('animate-fade-in-up');
      }, 0);
    } else {
      setAnimationClass('animate-collapse');

      timeoutRef.current = setTimeout(() => {
        setIsRendered(false);
        setAnimationClass('');
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, duration]);

  return {
    elementRef,
    animationClass,
    isRendered,
    shouldRender: isRendered,
  };
}
