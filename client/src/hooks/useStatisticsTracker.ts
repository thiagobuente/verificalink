/**
 * Hook para rastrear estatísticas em tempo real
 * Armazena dados localmente e sincroniza com a plataforma
 */

import { useState, useEffect, useCallback } from 'react';

export interface Statistics {
  totalAnalyses: number;
  threatsIdentified: number;
  maliciousURLs: number;
  intelligenceSources: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'shield_statistics';
const DEFAULT_STATS: Statistics = {
  totalAnalyses: 0,
  threatsIdentified: 0,
  maliciousURLs: 0,
  intelligenceSources: 14, // Número fixo de fontes
  lastUpdated: new Date().toISOString(),
};

export function useStatisticsTracker() {
  const [stats, setStats] = useState<Statistics>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estatísticas do localStorage ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStats(parsed);
      } else {
        // Inicializar com valores padrão
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registrar uma análise realizada
  const recordAnalysis = useCallback((threatDetected: boolean, isMalicious: boolean = false) => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_STATS));
      
      const updated: Statistics = {
        ...current,
        totalAnalyses: current.totalAnalyses + 1,
        threatsIdentified: threatDetected ? current.threatsIdentified + 1 : current.threatsIdentified,
        maliciousURLs: isMalicious ? current.maliciousURLs + 1 : current.maliciousURLs,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setStats(updated);
      
      return updated;
    } catch (error) {
      console.error('Erro ao registrar análise:', error);
      return stats;
    }
  }, [stats]);

  // Resetar estatísticas (apenas para desenvolvimento)
  const resetStatistics = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
      setStats(DEFAULT_STATS);
    } catch (error) {
      console.error('Erro ao resetar estatísticas:', error);
    }
  }, []);

  return {
    stats,
    isLoading,
    recordAnalysis,
    resetStatistics,
  };
}
