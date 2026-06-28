import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ScoreBreakdown {
  factor: string;
  points: number;
  description: string;
  icon: string;
}

interface MessageAnalysisResult {
  score: number;
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
  breakdown: ScoreBreakdown[];
  detectedThreats: string[];
  falsifiedIdentity: string | null;
  hasLinks: boolean;
  hasPIX: boolean;
  hasUrgency: boolean;
  socialEngineeringFactors: string[];
}

const IDENTITY_PATTERNS = [
  { name: 'Receita Federal', patterns: ['receita federal', 'imposto de renda', 'declaração', 'pendência fiscal'] },
  { name: 'Banco do Brasil', patterns: ['banco do brasil', 'bb', 'conta bloqueada', 'segurança da conta'] },
  { name: 'Itaú', patterns: ['itaú', 'itau', 'agência', 'conta itaú'] },
  { name: 'Bradesco', patterns: ['bradesco', 'bradesco net', 'conta bradesco'] },
  { name: 'Caixa', patterns: ['caixa', 'caixa econômica', 'fgts', 'auxílio'] },
  { name: 'Correios', patterns: ['correios', 'encomenda', 'pacote', 'rastreamento'] },
  { name: 'WhatsApp', patterns: ['whatsapp', 'conta whatsapp', 'verificação whatsapp'] },
  { name: 'YouTube', patterns: ['youtube', 'canal youtube', 'monetização'] },
  { name: 'Gov.br', patterns: ['gov.br', 'governo federal', 'portal gov'] },
  { name: 'Polícia Federal', patterns: ['polícia federal', 'pf', 'investigação', 'mandado'] },
];

const URGENCY_KEYWORDS = [
  'urgente', 'imediatamente', 'agora', 'rápido', 'clique já', 'não espere',
  'ação imediata', 'confirme agora', 'valide já', 'bloqueado', 'suspendido',
  'cancelado', 'expirado', 'vencido', 'limite atingido', 'acesso negado'
];

const FEAR_KEYWORDS = [
  'bloqueado', 'suspenso', 'cancelado', 'deletado', 'perdido', 'roubado',
  'fraude', 'crime', 'polícia', 'investigação', 'multa', 'processo',
  'ação legal', 'prisão', 'congelado', 'apreendido'
];

const PIX_KEYWORDS = ['pix', 'chave pix', 'transferência', 'pagamento', 'envie'];

const PASSWORD_KEYWORDS = ['senha', 'pin', 'código', 'otp', 'verificação', 'autenticação'];

const SHORTENED_URL_PATTERNS = [
  'bit.ly', 'tinyurl', 'short.link', 'goo.gl', 'ow.ly', 'buff.ly',
  'adf.ly', 'tiny.cc', 'is.gd', 'v.gd', 'shortened', 'link.com'
];

export default function MessageAnalyzer() {
  const [messageInput, setMessageInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<MessageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    breakdown: true,
    threats: false,
    socialEngineering: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const analyzeMessage = async () => {
    if (!messageInput.trim()) return;

    setIsAnalyzing(true);
    
    // Simular análise
    setTimeout(() => {
      const result = performAnalysis(messageInput);
      setAnalysisResult(result);
      setIsAnalyzing(false);
    }, 1500);
  };

  const performAnalysis = (message: string): MessageAnalysisResult => {
    const lowerMessage = message.toLowerCase();
    let score = 0;
    const breakdown: ScoreBreakdown[] = [];
    const detectedThreats: string[] = [];
    const socialEngineeringFactors: string[] = [];

    // 1. Detectar falsificação de identidade
    let falsifiedIdentity: string | null = null;
    for (const identity of IDENTITY_PATTERNS) {
      if (identity.patterns.some(p => lowerMessage.includes(p))) {
        falsifiedIdentity = identity.name;
        score += 30;
        breakdown.push({
          factor: `Falsificação de Identidade (${identity.name})`,
          points: 30,
          description: `Mensagem tenta se passar por ${identity.name}`,
          icon: '🚨'
        });
        detectedThreats.push(`Falsificação de ${identity.name}`);
        break;
      }
    }

    // 2. Detectar urgência
    const hasUrgency = URGENCY_KEYWORDS.some(k => lowerMessage.includes(k));
    if (hasUrgency) {
      score += 20;
      breakdown.push({
        factor: 'Linguagem de Urgência',
        points: 20,
        description: 'Mensagem usa palavras que criam pressão temporal',
        icon: '⏰'
      });
      detectedThreats.push('Pressão temporal');
      socialEngineeringFactors.push('Linguagem de urgência');
    }

    // 3. Detectar medo/pressão psicológica
    const hasFear = FEAR_KEYWORDS.some(k => lowerMessage.includes(k));
    if (hasFear) {
      score += 25;
      breakdown.push({
        factor: 'Pressão Psicológica',
        points: 25,
        description: 'Mensagem usa medo e ameaças para induzir ação',
        icon: '😨'
      });
      detectedThreats.push('Pressão psicológica');
      socialEngineeringFactors.push('Uso de medo e ameaças');
    }

    // 4. Detectar solicitação de PIX
    const hasPIX = PIX_KEYWORDS.some(k => lowerMessage.includes(k));
    if (hasPIX) {
      score += 35;
      breakdown.push({
        factor: 'Solicitação de PIX',
        points: 35,
        description: 'Mensagem solicita transferência via PIX',
        icon: '💰'
      });
      detectedThreats.push('Solicitação de PIX');
    }

    // 5. Detectar solicitação de senha/código
    const hasPassword = PASSWORD_KEYWORDS.some(k => lowerMessage.includes(k));
    if (hasPassword) {
      score += 40;
      breakdown.push({
        factor: 'Solicitação de Credenciais',
        points: 40,
        description: 'Mensagem solicita senha, PIN ou código de verificação',
        icon: '🔑'
      });
      detectedThreats.push('Solicitação de credenciais');
      socialEngineeringFactors.push('Tentativa de roubo de credenciais');
    }

    // 6. Detectar URLs encurtadas
    const hasShortURL = SHORTENED_URL_PATTERNS.some(p => lowerMessage.includes(p));
    if (hasShortURL || /https?:\/\/[a-z0-9.]{1,10}\/[a-z0-9]{1,5}/i.test(message)) {
      score += 15;
      breakdown.push({
        factor: 'URL Encurtada/Suspeita',
        points: 15,
        description: 'Mensagem contém URL encurtada ou suspeita',
        icon: '🔗'
      });
      detectedThreats.push('URL encurtada detectada');
    }

    // 7. Detectar excesso de pontuação/maiúsculas (padrão de golpe)
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    const punctuationRatio = (message.match(/[!?]/g) || []).length / message.length;
    
    if (capsRatio > 0.3) {
      score += 10;
      breakdown.push({
        factor: 'Uso Excessivo de MAIÚSCULAS',
        points: 10,
        description: 'Padrão comum em mensagens de golpe',
        icon: '📢'
      });
      socialEngineeringFactors.push('Uso excessivo de maiúsculas');
    }

    if (punctuationRatio > 0.15) {
      score += 8;
      breakdown.push({
        factor: 'Pontuação Excessiva',
        points: 8,
        description: 'Múltiplos pontos de exclamação/interrogação',
        icon: '❗'
      });
      socialEngineeringFactors.push('Pontuação excessiva');
    }

    // 8. Detectar comprimento da mensagem (muito curta = suspeita)
    if (message.length < 30) {
      score += 5;
      breakdown.push({
        factor: 'Mensagem Muito Curta',
        points: 5,
        description: 'Mensagens muito curtas podem ser automáticas',
        icon: '📝'
      });
    }

    // Limitar score a 100
    score = Math.min(score, 100);

    // Determinar nível de risco
    let riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
    if (score < 20) riskLevel = 'baixo';
    else if (score < 50) riskLevel = 'moderado';
    else if (score < 75) riskLevel = 'alto';
    else riskLevel = 'crítico';

    return {
      score,
      riskLevel,
      breakdown,
      detectedThreats,
      falsifiedIdentity,
      hasLinks: hasShortURL || /https?:\/\//.test(message),
      hasPIX,
      hasUrgency,
      socialEngineeringFactors,
    };
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'baixo':
        return 'from-green-900/20 to-green-800/10 border-green-500/30';
      case 'moderado':
        return 'from-yellow-900/20 to-yellow-800/10 border-yellow-500/30';
      case 'alto':
        return 'from-orange-900/20 to-orange-800/10 border-orange-500/30';
      case 'crítico':
        return 'from-red-900/20 to-red-800/10 border-red-500/30';
      default:
        return 'from-slate-900/20 to-slate-800/10 border-slate-500/30';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'baixo':
        return 'text-green-400';
      case 'moderado':
        return 'text-yellow-400';
      case 'alto':
        return 'text-orange-400';
      case 'crítico':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'baixo':
        return '🟢 Baixo Risco';
      case 'moderado':
        return '🟡 Risco Moderado';
      case 'alto':
        return '🟠 Alto Risco';
      case 'crítico':
        return '🔴 Risco Crítico';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* INPUT SECTION */}
      <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-purple-400 leading-tight">💬 Analisador de Mensagens</h2>
        </div>

        <p className="text-slate-400 text-sm mb-4 leading-relaxed">
          Cole uma mensagem do WhatsApp, SMS ou Email para detectar padrões de golpe, engenharia social e falsificação de identidade.
        </p>

        {/* TEXTAREA */}
        <Textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Cole a mensagem aqui... Ex: 'Receita Federal identificou pendências. Clique aqui para regularizar: bit.ly/abc123'"
          className="w-full h-40 bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 resize-none leading-relaxed"
        />

        {/* ANALYZE BUTTON */}
        <div className="mt-4">
          <Button
            onClick={analyzeMessage}
            disabled={!messageInput.trim() || isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
          >
            {isAnalyzing ? '⏳ Analisando...' : '🔍 Analisar Mensagem'}
          </Button>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {analysisResult && (
        <div className="space-y-4">
          {/* RISK SCORE */}
          <div className={`rounded-xl border-2 bg-gradient-to-br ${getRiskColor(analysisResult.riskLevel)} p-6 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-2xl font-bold ${getRiskTextColor(analysisResult.riskLevel)} leading-tight`}>
                {getRiskLabel(analysisResult.riskLevel)}
              </h3>
              <div className="text-right">
                <p className="text-slate-400 text-sm font-medium leading-relaxed">Score de Risco</p>
                <p className={`text-4xl font-bold ${getRiskTextColor(analysisResult.riskLevel)} leading-tight`}>
                  {analysisResult.score}%
                </p>
              </div>
            </div>

            {analysisResult.falsifiedIdentity && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
                <p className="text-red-300 text-sm font-semibold leading-relaxed">
                  🚨 Falsificação de Identidade Detectada: {analysisResult.falsifiedIdentity}
                </p>
              </div>
            )}
          </div>

          {/* SCORE BREAKDOWN */}
          <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm">
            <button
              onClick={() => toggleSection('breakdown')}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-cyan-400" />
                <h3 className="text-lg font-bold text-cyan-400 leading-tight">📊 Composição do Score</h3>
              </div>
              {expandedSections.breakdown ? (
                <ChevronUp className="w-5 h-5 text-cyan-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-cyan-400" />
              )}
            </button>

            {expandedSections.breakdown && (
              <div className="mt-4 space-y-3 pt-4 border-t border-cyan-500/20">
                {analysisResult.breakdown.map((item, idx) => (
                  <div key={idx} className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20 flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="text-cyan-300 text-sm font-semibold leading-relaxed">{item.icon} {item.factor}</p>
                      <p className="text-cyan-200/70 text-xs mt-1 leading-relaxed">{item.description}</p>
                    </div>
                    <p className="text-cyan-400 font-bold text-lg flex-shrink-0 leading-tight">+{item.points}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DETECTED THREATS */}
          {analysisResult.detectedThreats.length > 0 && (
            <div className="rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-6 backdrop-blur-sm">
              <button
                onClick={() => toggleSection('threats')}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  <h3 className="text-lg font-bold text-orange-400 leading-tight">⚠️ Ameaças Detectadas</h3>
                </div>
                {expandedSections.threats ? (
                  <ChevronUp className="w-5 h-5 text-orange-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-orange-400" />
                )}
              </button>

              {expandedSections.threats && (
                <div className="mt-4 space-y-2 pt-4 border-t border-orange-500/20">
                  {analysisResult.detectedThreats.map((threat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-orange-300 text-sm leading-relaxed">
                      <span className="text-orange-400">•</span>
                      <span>{threat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SOCIAL ENGINEERING FACTORS */}
          {analysisResult.socialEngineeringFactors.length > 0 && (
            <div className="rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-900/20 to-pink-800/10 p-6 backdrop-blur-sm">
              <button
                onClick={() => toggleSection('socialEngineering')}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-pink-400" />
                  <h3 className="text-lg font-bold text-pink-400 leading-tight">🎭 Técnicas de Engenharia Social</h3>
                </div>
                {expandedSections.socialEngineering ? (
                  <ChevronUp className="w-5 h-5 text-pink-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-pink-400" />
                )}
              </button>

              {expandedSections.socialEngineering && (
                <div className="mt-4 space-y-2 pt-4 border-t border-pink-500/20">
                  {analysisResult.socialEngineeringFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-pink-300 text-sm leading-relaxed">
                      <span className="text-pink-400">•</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RECOMMENDATIONS */}
          <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-blue-400 mb-4 leading-tight">💡 Recomendações</h3>
            <div className="space-y-3 text-blue-300 text-sm leading-relaxed">
              <p>
                ✓ <strong>Não clique em links</strong> - Especialmente se a mensagem criar urgência
              </p>
              <p>
                ✓ <strong>Nunca compartilhe credenciais</strong> - Órgãos públicos e bancos nunca pedem senha por mensagem
              </p>
              <p>
                ✓ <strong>Verifique por ligação</strong> - Ligue para o número oficial da instituição usando número que você conhece
              </p>
              <p>
                ✓ <strong>Desconfie de urgência</strong> - Golpistas criam pressão temporal para evitar que você pense
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
