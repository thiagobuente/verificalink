import React, { useState, useEffect } from 'react';
import { Brain, Loader, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnalysisResult {
  url: string;
  riskScore: number;
  threats: string[];
  isPhishing: boolean;
  isMalware: boolean;
  isTyposquatting: boolean;
  domainAge?: number;
  country?: string;
  hasSSL?: boolean;
}

interface AIExplanationProps {
  analysisResult: AnalysisResult;
  isLoading?: boolean;
}

export const AIExplanation: React.FC<AIExplanationProps> = ({ analysisResult, isLoading = false }) => {
  const [explanation, setExplanation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    generateExplanation();
  }, [analysisResult]);

  const generateExplanation = async () => {
    setIsGenerating(true);
    setDisplayedText('');

    const explanationText = generateSimpleExplanation(analysisResult);
    
    // Simular digitação progressiva para melhor UX
    let index = 0;
    const interval = setInterval(() => {
      if (index < explanationText.length) {
        setDisplayedText(explanationText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 15);

    setExplanation(explanationText);
  };

  const generateSimpleExplanation = (result: AnalysisResult): string => {
    let text = '';

    // Introdução
    text += `🔍 **Análise de ${result.url}**\n\n`;

    // Nível de risco
    if (result.riskScore >= 70) {
      text += `⚠️ **ALERTA: Este link parece ser PERIGOSO**\n`;
      text += `Risco detectado: ${result.riskScore}% - NÃO clique neste link!\n\n`;
    } else if (result.riskScore >= 40) {
      text += `⚠️ **ATENÇÃO: Este link apresenta riscos**\n`;
      text += `Risco detectado: ${result.riskScore}% - Verifique com cuidado antes de clicar.\n\n`;
    } else {
      text += `✅ **Este link parece ser SEGURO**\n`;
      text += `Risco detectado: ${result.riskScore}% - Aparentemente seguro para clicar.\n\n`;
    }

    // Explicação das ameaças
    if (result.threats.length > 0) {
      text += `**O que foi detectado:**\n`;
      result.threats.forEach((threat) => {
        text += `• ${threat}\n`;
      });
      text += '\n';
    }

    // Explicações específicas
    if (result.isPhishing) {
      text += `**Por que é phishing?**\n`;
      text += `Este link tenta enganar você fingindo ser de um site legítimo. Criminosos usam técnicas para copiar o visual de bancos, redes sociais ou lojas para roubar suas informações.\n\n`;
    }

    if (result.isMalware) {
      text += `**Por que tem malware?**\n`;
      text += `Este link pode conter vírus ou programas maliciosos que podem danificar seu celular ou computador. Não clique!\n\n`;
    }

    if (result.isTyposquatting) {
      text += `**Por que é typosquatting?**\n`;
      text += `O domínio é muito parecido com um site famoso (como "gogle.com" em vez de "google.com"). Criminosos usam isso para enganar pessoas que digitam errado.\n\n`;
    }

    // Informações do domínio
    text += `**Informações do Domínio:**\n`;
    if (result.domainAge) {
      const ageInDays = Math.floor((Date.now() - result.domainAge) / (1000 * 60 * 60 * 24));
      if (ageInDays < 30) {
        text += `• Domínio muito novo (${ageInDays} dias) - ⚠️ Sinal de alerta\n`;
      } else {
        text += `• Domínio com ${ageInDays} dias de idade\n`;
      }
    }
    if (result.country) {
      text += `• País: ${result.country}\n`;
    }
    if (result.hasSSL !== undefined) {
      text += `• SSL/HTTPS: ${result.hasSSL ? '✅ Sim (seguro)' : '❌ Não (inseguro)'}\n`;
    }
    text += '\n';

    // Recomendação final
    text += `**O que você deve fazer:**\n`;
    if (result.riskScore >= 70) {
      text += `1. ❌ NÃO clique neste link\n`;
      text += `2. ❌ NÃO forneça informações pessoais\n`;
      text += `3. ✅ Reporte como spam/phishing\n`;
      text += `4. ✅ Avise seus contatos sobre este link perigoso\n`;
    } else if (result.riskScore >= 40) {
      text += `1. ⚠️ Tenha cuidado antes de clicar\n`;
      text += `2. ⚠️ Verifique a origem da mensagem\n`;
      text += `3. ⚠️ Nunca forneça dados pessoais\n`;
      text += `4. ✅ Quando em dúvida, contate a empresa diretamente\n`;
    } else {
      text += `1. ✅ Este link parece seguro\n`;
      text += `2. ✅ Mas sempre mantenha a cautela\n`;
      text += `3. ✅ Nunca forneça senhas ou dados bancários em sites\n`;
      text += `4. ✅ Verifique a barra de endereço antes de fazer login\n`;
    }

    return text;
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (isLoading) {
    return (
      <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse'>
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-4 bg-slate-600 rounded' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4'>
      <div className='flex items-center gap-2 mb-4'>
        {isGenerating ? (
          <Loader className='w-5 h-5 text-cyan-400 animate-spin' />
        ) : (
          <Brain className='w-5 h-5 text-cyan-400' />
        )}
        <h4 className='text-lg font-bold text-cyan-400'>🤖 Explicação por IA</h4>
      </div>

      <div className={`${getRiskColor(analysisResult.riskScore)} text-sm leading-relaxed whitespace-pre-wrap font-mono`}>
        {displayedText}
        {isGenerating && <span className='animate-pulse'>|</span>}
      </div>

      {!isGenerating && (
        <div className='mt-4 flex gap-2'>
          <button
            onClick={generateExplanation}
            className='flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors'
          >
            🔄 Regenerar Explicação
          </button>
        </div>
      )}
    </div>
  );
};

export default AIExplanation;
