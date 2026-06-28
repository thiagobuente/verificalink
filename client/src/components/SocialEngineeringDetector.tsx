import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface SocialEngineeringIndicator {
  type: 'urgency' | 'authority' | 'scarcity' | 'curiosity' | 'fear' | 'reward';
  keyword: string;
  description: string;
  riskLevel: 'high' | 'medium' | 'low';
  examples: string[];
}

interface SocialEngineeringDetectorProps {
  isLoading?: boolean;
}

const SOCIAL_ENGINEERING_PATTERNS: Record<string, SocialEngineeringIndicator> = {
  urgency: {
    type: 'urgency',
    keyword: 'Urgência',
    description: 'Pressão temporal para agir rapidamente sem pensar',
    riskLevel: 'high',
    examples: ['agora', 'imediatamente', 'urgente', 'rápido', 'não perca', 'últimas horas', 'expira em'],
  },
  authority: {
    type: 'authority',
    keyword: 'Autoridade',
    description: 'Falsificação de autoridade ou confiança',
    riskLevel: 'high',
    examples: ['banco', 'polícia', 'governo', 'oficial', 'verificado', 'administrador', 'suporte técnico'],
  },
  scarcity: {
    type: 'scarcity',
    keyword: 'Escassez',
    description: 'Criação de sensação de falta ou exclusividade',
    riskLevel: 'medium',
    examples: ['limitado', 'últimas unidades', 'exclusivo', 'restrito', 'esgotado', 'poucos restantes'],
  },
  curiosity: {
    type: 'curiosity',
    keyword: 'Curiosidade',
    description: 'Exploração da curiosidade natural do usuário',
    riskLevel: 'medium',
    examples: ['clique aqui', 'descubra', 'veja', 'saiba mais', 'surpresa', 'você não vai acreditar'],
  },
  fear: {
    type: 'fear',
    keyword: 'Medo',
    description: 'Exploração do medo para motivar ação',
    riskLevel: 'high',
    examples: ['perigo', 'risco', 'ameaça', 'vírus', 'hackeado', 'comprometido', 'fraude'],
  },
  reward: {
    type: 'reward',
    keyword: 'Recompensa',
    description: 'Promessa de ganho ou benefício irreal',
    riskLevel: 'medium',
    examples: ['ganhe', 'prêmio', 'grátis', 'bônus', 'desconto', 'dinheiro', 'riqueza'],
  },
};

export const SocialEngineeringDetector: React.FC<SocialEngineeringDetectorProps> = ({ isLoading = false }) => {
  const [text, setText] = useState('');
  const [detectedPatterns, setDetectedPatterns] = useState<SocialEngineeringIndicator[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = () => {
    setIsAnalyzing(true);
    const lowerText = text.toLowerCase();
    const patterns: SocialEngineeringIndicator[] = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;

    Object.values(SOCIAL_ENGINEERING_PATTERNS).forEach((pattern) => {
      const hasMatch = pattern.examples.some((example) => lowerText.includes(example));
      if (hasMatch) {
        patterns.push(pattern);
        if (pattern.riskLevel === 'high') highRiskCount++;
        if (pattern.riskLevel === 'medium') mediumRiskCount++;
      }
    });

    const score = Math.min(100, highRiskCount * 30 + mediumRiskCount * 15);
    setRiskScore(score);
    setDetectedPatterns(patterns.sort((a, b) => (a.riskLevel === 'high' ? -1 : 1)));
    setIsAnalyzing(false);
  };

  if (isLoading) {
    return (
      <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-pulse'>
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-20 bg-slate-600 rounded' />
          ))}
        </div>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500' };
    if (score >= 40) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500' };
    return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500' };
  };

  const riskColor = getRiskColor(riskScore);

  return (
    <div className='bg-slate-700/30 border border-slate-600 rounded-lg p-4'>
      <div className='flex items-center gap-2 mb-4'>
        <Zap className='w-5 h-5 text-cyan-400' />
        <h4 className='text-lg font-bold text-cyan-400'>⚡ Detector de Engenharia Social</h4>
      </div>

      <div className='space-y-3 mb-4'>
        <p className='text-slate-400 text-sm'>Cole o texto da mensagem para análise:</p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Cole aqui a mensagem, email ou texto suspeito...'
          className='min-h-24 bg-slate-800/50 border-slate-600 text-slate-300 placeholder-slate-500'
        />
        <Button
          onClick={analyzeText}
          disabled={!text.trim() || isAnalyzing}
          className='w-full bg-blue-600 hover:bg-blue-500 text-white font-bold'
        >
          {isAnalyzing ? 'Analisando...' : 'Analisar Texto'}
        </Button>
      </div>

      {detectedPatterns.length > 0 && (
        <div className='space-y-4'>
          <div className={`${riskColor.bg} border ${riskColor.border} rounded-lg p-4`}>
            <div className='flex items-center justify-between mb-2'>
              <p className={`${riskColor.color} font-bold text-lg`}>Risco de Engenharia Social: {riskScore}%</p>
              {riskScore >= 70 ? (
                <AlertTriangle className={`w-6 h-6 ${riskColor.color}`} />
              ) : (
                <CheckCircle2 className={`w-6 h-6 ${riskColor.color}`} />
              )}
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2 overflow-hidden'>
              <div
                className={`h-full transition-all ${riskScore >= 70 ? 'bg-red-500' : riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>

          <div>
            <p className='text-slate-400 text-sm font-semibold mb-2'>Padrões Detectados:</p>
            <div className='space-y-2'>
              {detectedPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className={`${pattern.riskLevel === 'high' ? 'bg-red-500/10 border-red-500' : 'bg-yellow-500/10 border-yellow-500'} border-l-4 p-3 rounded`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex-1'>
                      <p className={`${pattern.riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'} font-bold text-sm`}>
                        {pattern.keyword}
                      </p>
                      <p className='text-slate-300 text-xs mt-1'>{pattern.description}</p>
                    </div>
                    <span className={`${pattern.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'} px-2 py-1 rounded text-xs font-bold whitespace-nowrap flex-shrink-0`}>
                      {pattern.riskLevel === 'high' ? 'Alto' : 'Médio'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-blue-500/10 border border-blue-500 rounded p-3'>
            <p className='text-blue-400 font-bold text-sm mb-1'>💡 Recomendação:</p>
            <p className='text-blue-300 text-xs'>
              {riskScore >= 70
                ? 'Este texto apresenta múltiplos sinais de engenharia social. Não clique em links ou forneça informações pessoais.'
                : riskScore >= 40
                ? 'Este texto pode conter técnicas de engenharia social. Verifique a origem antes de agir.'
                : 'Este texto não apresenta sinais óbvios de engenharia social, mas sempre mantenha a cautela.'}
            </p>
          </div>
        </div>
      )}

      {text && detectedPatterns.length === 0 && (
        <div className='bg-green-500/10 border border-green-500 rounded p-3 text-center'>
          <p className='text-green-400 text-sm'>✓ Nenhum padrão de engenharia social detectado neste texto.</p>
        </div>
      )}
    </div>
  );
};

export default SocialEngineeringDetector;
