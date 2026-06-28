import { useState, useCallback, useEffect, useRef } from 'react';
import { analisarMensagem, obterNivelRiscoMensagem, gerarExplicacaoMensagem, gerarResumoMensagem, obterCorRiscoMensagem } from '@/lib/messageAnalysis';

export interface RealtimeAnalysisResult {
  score: number;
  nivelRisco: string;
  isScam: boolean;
  riscos: any;
  padrõesDetectados: any;
  explicacoes: string[];
  resumo: string;
  corRisco: string;
  temLink: boolean;
  temTelefone: boolean;
  emojiCount: number;
  capsRatio: number;
}

interface UseRealtimeMessageAnalysisProps {
  debounceMs?: number;
}

export function useRealtimeMessageAnalysis(props?: UseRealtimeMessageAnalysisProps) {
  const { debounceMs = 300 } = props || {};
  
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<RealtimeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função de análise sem debounce
  const performAnalysis = useCallback((text: string) => {
    if (!text.trim()) {
      setAnalysis(null);
      return;
    }

    try {
      setIsAnalyzing(true);
      const analise = analisarMensagem(text);

      const result: RealtimeAnalysisResult = {
        score: analise.score,
        nivelRisco: obterNivelRiscoMensagem(analise.score),
        isScam: analise.score >= 50,
        riscos: analise.riscos,
        padrõesDetectados: analise.padrõesDetectados,
        explicacoes: gerarExplicacaoMensagem(analise),
        resumo: gerarResumoMensagem(analise.score),
        corRisco: obterCorRiscoMensagem(analise.score),
        temLink: analise.temLink,
        temTelefone: analise.temTelefone,
        emojiCount: analise.emojiCount,
        capsRatio: analise.capsRatio
      };

      setAnalysis(result);
    } catch (error) {
      console.error('Erro ao analisar mensagem em tempo real:', error);
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Função para atualizar a mensagem com debounce
  const updateMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Definir novo timer
    debounceTimerRef.current = setTimeout(() => {
      performAnalysis(newMessage);
    }, debounceMs);
  }, [debounceMs, performAnalysis]);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    message,
    updateMessage,
    analysis,
    isAnalyzing
  };
}
