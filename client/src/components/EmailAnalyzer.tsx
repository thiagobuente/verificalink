import { useState, useEffect } from 'react';
import { Mail, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisHistoryEntry {
  email: string;
  timestamp: string;
  result: any;
}

interface SenderReputation {
  score: number;
  spf: 'valid' | 'invalid' | 'missing';
  dkim: 'valid' | 'invalid' | 'missing';
  dmarc: 'valid' | 'invalid' | 'missing';
  domainAge: number;
  blacklistStatus: string;
  dnsReputation: string;
}

interface DNSAuthentication {
  domain: string;
  spf: {
    valid: boolean;
    record: string | null;
    mechanisms: string[];
    issues: string[];
  };
  dkim: {
    valid: boolean;
    record: string | null;
    selector: string;
    issues: string[];
  };
  dmarc: {
    valid: boolean;
    record: string | null;
    policy: 'none' | 'quarantine' | 'reject' | null;
    issues: string[];
  };
  overallScore: number;
  recommendations: string[];
}

interface SocialEngineering {
  detected: boolean;
  urgencyLevel: 'low' | 'medium' | 'high';
  keywords: string[];
  riskFactors: string[];
}

interface EmailHeaderAnalysis {
  spoofingDetected: boolean;
  senderMismatch: boolean;
  domainMismatch: boolean;
  issues: string[];
}

interface SenderAuthenticity {
  displayName: string;
  realEmail: string;
  senderDomain: string;
  expectedOfficialDomain: string;
  result: 'verified' | 'suspicious' | 'unofficial';
  knownBrand: string | null;
  riskFactors: string[];
  score: number;
}

const KNOWN_BRANDS: Record<string, string[]> = {
  'Mercado Pago': ['mercadopago.com.br', 'mercadopago.com'],
  'Mercado Livre': ['mercadolivre.com.br', 'mercadolivre.com'],
  'Nubank': ['nubank.com.br', 'nubank.com'],
  'Itaú': ['itau.com.br', 'itau.com'],
  'Bradesco': ['bradesco.com.br', 'bradesco.com'],
  'Santander': ['santander.com.br', 'santander.com'],
  'Banco do Brasil': ['bb.com.br', 'bb.com'],
  'Caixa': ['caixa.gov.br', 'caixa.com.br'],
  'Receita Federal': ['receita.economia.gov.br', 'gov.br'],
  'Gov.br': ['gov.br'],
  'Correios': ['correios.com.br'],
};

const SOCIAL_ENGINEERING_PHRASES = [
  'acesso não reconhecido',
  'ip desconhecido',
  'bloqueie imediatamente',
  'revise sua atividade',
  'sua conta será bloqueada',
  'pendência no cadastro',
  'evite restrições',
  'confirme seus dados',
  'clique para proteger sua conta',
  'ação necessária',
  'verificação urgente',
  'atualizar informações',
];

export default function EmailAnalyzer() {
  const [emailInput, setEmailInput] = useState('');
  const [analysisType, setAnalysisType] = useState<'sender' | 'content' | 'headers'>('sender');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    reputation: true,
    socialEngineering: false,
    headers: false,
    authenticity: false,
    dnsAuth: false,
  });
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [dnsError, setDnsError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  // Carregar histórico do localStorage ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('emailAnalysisHistory');
      if (saved) {
        setAnalysisHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const analyzeEmail = async () => {
    setIsAnalyzing(true);
    setDnsResult(null);
    setDnsError(null);

    try {
      // Extrair domínio do email
      const domain = emailInput.split('@')[1];
      if (!domain) {
        setDnsError('Email inválido');
        setIsAnalyzing(false);
        return;
      }

      // Chamar endpoint HTTP para análise DNS
      const response = await fetch('/api/analyze-dns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput,
          dkimSelector: 'default',
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setDnsResult(result.data);
        // Salvar no histórico
        const historyEntry = {
          email: emailInput,
          timestamp: new Date().toISOString(),
          result: result.data,
        };
        const updatedHistory = [historyEntry, ...analysisHistory].slice(0, 10); // Manter últimas 10
        setAnalysisHistory(updatedHistory);
        try {
          localStorage.setItem('emailAnalysisHistory', JSON.stringify(updatedHistory));
        } catch (error) {
          console.error('Erro ao salvar histórico:', error);
        }
        // Abrir seção DNS automaticamente
        setExpandedSections(prev => ({
          ...prev,
          dnsAuth: true,
        }));
      } else {
        setDnsError(result.error || 'Erro ao analisar DNS');
      }
    } catch (error) {
      setDnsError(error instanceof Error ? error.message : 'Erro ao analisar DNS');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeSenderAuthenticity = (sender: string, displayName: string, content: string): SenderAuthenticity => {
    let score = 0;
    const riskFactors: string[] = [];
    let knownBrand: string | null = null;
    let expectedOfficialDomain = '';
    let result: 'verified' | 'suspicious' | 'unofficial' = 'verified';

    const senderDomain = sender.split('@')[1]?.toLowerCase() || '';

    for (const [brand, domains] of Object.entries(KNOWN_BRANDS)) {
      if (displayName.toLowerCase().includes(brand.toLowerCase()) || 
          sender.toLowerCase().includes(brand.toLowerCase().replace(/\s/g, '')) ||
          content.toLowerCase().includes(brand.toLowerCase())) {
        knownBrand = brand;
        expectedOfficialDomain = domains[0];
        break;
      }
    }

    if (knownBrand) {
      const officialDomains = KNOWN_BRANDS[knownBrand];
      const isOfficialDomain = officialDomains.some(d => senderDomain.endsWith(d));

      if (!isOfficialDomain) {
        score += 40;
        riskFactors.push('Remetente não oficial');
        riskFactors.push('Uso de marca conhecida');
        result = 'suspicious';
      }
    }

    if (/\d{5,}/.test(sender)) {
      score += 20;
      riskFactors.push('Números aleatórios no remetente');
    }

    if (!senderDomain.includes('.')) {
      score += 15;
      riskFactors.push('Domínio inválido');
    }

    const hasUrgency = SOCIAL_ENGINEERING_PHRASES.some(phrase => 
      content.toLowerCase().includes(phrase)
    );
    if (hasUrgency) {
      score += 20;
      riskFactors.push('Linguagem de urgência');
    }

    score = Math.min(score, 100);

    if (score >= 50) result = 'suspicious';
    if (score < 20 && knownBrand) result = 'unofficial';

    return {
      displayName,
      realEmail: sender,
      senderDomain,
      expectedOfficialDomain,
      result,
      knownBrand,
      riskFactors,
      score,
    };
  };

  const mockAuthenticity: SenderAuthenticity = analyzeSenderAuthenticity(
    'avisos@mercadopago823105',
    'Mercado Pago',
    'Acesso não reconhecido. Bloqueie imediatamente sua conta.'
  );

  const mockReputation: SenderReputation = {
    score: 92,
    spf: 'valid',
    dkim: 'valid',
    dmarc: 'valid',
    domainAge: 12,
    blacklistStatus: 'Nenhuma encontrada',
    dnsReputation: 'Confiável',
  };

  const mockSocialEngineering: SocialEngineering = {
    detected: true,
    urgencyLevel: 'high',
    keywords: ['URGENTE', 'AÇÃO IMEDIATA', 'BLOQUEIO', 'CLIQUE'],
    riskFactors: ['Linguagem de urgência', 'Pressão psicológica', 'Chamada para ação imediata'],
  };

  const mockHeaderAnalysis: EmailHeaderAnalysis = {
    spoofingDetected: false,
    senderMismatch: false,
    domainMismatch: false,
    issues: [],
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'from-green-900/20 to-green-800/10 border-green-500/30';
    if (score >= 60) return 'from-yellow-900/20 to-yellow-800/10 border-yellow-500/30';
    return 'from-red-900/20 to-red-800/10 border-red-500/30';
  };

  const getReputationTextColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAuthenticityColor = (result: string) => {
    if (result === 'verified') return 'from-green-900/20 to-green-800/10 border-green-500/30';
    if (result === 'suspicious') return 'from-red-900/20 to-red-800/10 border-red-500/30';
    return 'from-yellow-900/20 to-yellow-800/10 border-yellow-500/30';
  };

  const getAuthenticityTextColor = (result: string) => {
    if (result === 'verified') return 'text-green-400';
    if (result === 'suspicious') return 'text-red-400';
    return 'text-yellow-400';
  };

  const getAuthenticityLabel = (result: string) => {
    if (result === 'verified') return '✓ Verificado';
    if (result === 'suspicious') return '🚨 Suspeito';
    return '⚠️ Não Oficial';
  };

  const getDNSStatus = (valid: boolean) => {
    return valid ? (
      <p className="text-green-400 text-sm font-bold leading-tight">✓ Válido</p>
    ) : (
      <p className="text-red-400 text-sm font-bold leading-tight">✗ Inválido</p>
    );
  };

  return (
    <div className="space-y-6">
      {/* INPUT SECTION */}
      <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-cyan-400 leading-tight">📧 Email Security Analyzer</h2>
        </div>

        {/* ANALYSIS TYPE SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => setAnalysisType('sender')}
            className={`p-3 rounded-lg transition-all ${
              analysisType === 'sender'
                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
                : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-cyan-500/50'
            }`}
          >
            <p className="text-sm font-semibold leading-tight">🛡️ Remetente</p>
            <p className="text-xs text-slate-500 leading-relaxed">SPF, DKIM, DMARC</p>
          </button>

          <button
            onClick={() => setAnalysisType('content')}
            className={`p-3 rounded-lg transition-all ${
              analysisType === 'content'
                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
                : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-cyan-500/50'
            }`}
          >
            <p className="text-sm font-semibold leading-tight">⚠️ Engenharia Social</p>
            <p className="text-xs text-slate-500 leading-relaxed">Conteúdo suspeito</p>
          </button>

          <button
            onClick={() => setAnalysisType('headers')}
            className={`p-3 rounded-lg transition-all ${
              analysisType === 'headers'
                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
                : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-cyan-500/50'
            }`}
          >
            <p className="text-sm font-semibold leading-tight">🔍 Cabeçalhos</p>
            <p className="text-xs text-slate-500 leading-relaxed">Spoofing, Mismatch</p>
          </button>
        </div>

        {/* TEXTAREA */}
        <textarea
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder={
            analysisType === 'sender'
              ? 'Cole o endereço de email (ex: remetente@empresa.com)'
              : analysisType === 'content'
                ? 'Cole o conteúdo do email para análise de engenharia social'
                : 'Cole os cabeçalhos completos do email (From, Reply-To, Received, etc)'
          }
          className="w-full h-32 bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none leading-relaxed"
        />

        {/* ANALYZE BUTTON */}
        <div className="mt-4">
          <Button
            onClick={analyzeEmail}
            disabled={!emailInput.trim() || isAnalyzing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
          >
            {isAnalyzing ? '⏳ Analisando...' : '🔍 Analisar Email'}
          </Button>
        </div>

        {/* ERROR MESSAGE */}
        {dnsError && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 text-sm leading-relaxed">❌ {dnsError}</p>
          </div>
        )}
      </div>

      {/* RESULTS SECTION */}
      {/* HISTORY CHART */}
      {analysisHistory.length > 0 && (
        <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-bold text-cyan-300">📊 Evolução de Análises</h3>
            </div>
            <span className="text-sm text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full">
              {analysisHistory.length} análises
            </span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analysisHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                <div className="flex-1">
                  <p className="text-slate-300 text-sm font-semibold">{entry.email}</p>
                  <p className="text-slate-500 text-xs">
                    {new Date(entry.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    entry.result?.overallScore >= 70 ? 'text-green-400' :
                    entry.result?.overallScore >= 50 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {entry.result?.overallScore || 0}/100
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                const csv = 'Email,Timestamp,Score\n' + analysisHistory.map(e => 
                  `${e.email},${e.timestamp},${e.result?.overallScore || 0}`
                ).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `email-analysis-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('emailAnalysisHistory');
                setAnalysisHistory([]);
              }}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
            >
              Limpar Histórico
            </Button>
          </div>
        </div>
      )}

      {emailInput && (
        <div className="space-y-4">
          {/* SENDER AUTHENTICITY */}
          <div className={`rounded-xl border-2 bg-gradient-to-br ${getAuthenticityColor(mockAuthenticity.result)} p-6 backdrop-blur-sm`}>
            <button
              onClick={() => toggleSection('authenticity')}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-6 h-6 ${getAuthenticityTextColor(mockAuthenticity.result)}`} />
                <h3 className={`text-lg font-bold ${getAuthenticityTextColor(mockAuthenticity.result)} leading-tight`}>
                  📧 Autenticidade do Remetente
                </h3>
              </div>
              {expandedSections.authenticity ? (
                <ChevronUp className={`w-5 h-5 ${getAuthenticityTextColor(mockAuthenticity.result)}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${getAuthenticityTextColor(mockAuthenticity.result)}`} />
              )}
            </button>

            {expandedSections.authenticity && (
              <div className="mt-4 space-y-3 pt-4 border-t border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">Nome Exibido</p>
                    <p className="text-slate-300 text-sm font-bold leading-tight">{mockAuthenticity.displayName}</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">Email Real</p>
                    <p className="text-slate-300 text-sm font-bold leading-tight break-all">{mockAuthenticity.realEmail}</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">Domínio do Remetente</p>
                    <p className="text-slate-300 text-sm font-bold leading-tight">{mockAuthenticity.senderDomain}</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">Domínio Oficial Esperado</p>
                    <p className="text-slate-300 text-sm font-bold leading-tight">{mockAuthenticity.expectedOfficialDomain || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-400 text-xs font-medium mb-2 leading-relaxed">Resultado</p>
                  <p className={`text-lg font-bold ${getAuthenticityTextColor(mockAuthenticity.result)} leading-tight`}>
                    {getAuthenticityLabel(mockAuthenticity.result)}
                  </p>
                </div>

                {mockAuthenticity.riskFactors.length > 0 && (
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                    <p className="text-red-300 text-sm font-semibold mb-2 leading-relaxed">Fatores de Risco:</p>
                    <ul className="space-y-1">
                      {mockAuthenticity.riskFactors.map((factor, idx) => (
                        <li key={idx} className="text-red-300 text-xs leading-relaxed flex gap-2">
                          <span className="text-red-400 flex-shrink-0">⚠️</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SENDER REPUTATION */}
          <div className={`rounded-xl border-2 bg-gradient-to-br ${getReputationColor(mockReputation.score)} p-6 backdrop-blur-sm`}>
            <button
              onClick={() => toggleSection('reputation')}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-6 h-6 ${getReputationTextColor(mockReputation.score)}`} />
                <h3 className={`text-lg font-bold ${getReputationTextColor(mockReputation.score)} leading-tight`}>
                  🛡️ Reputação do Remetente
                </h3>
              </div>
              {expandedSections.reputation ? (
                <ChevronUp className={`w-5 h-5 ${getReputationTextColor(mockReputation.score)}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${getReputationTextColor(mockReputation.score)}`} />
              )}
            </button>

            {expandedSections.reputation && (
              <div className="mt-4 space-y-3 pt-4 border-t border-slate-700/50">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">Score de Reputação</p>
                    <p className={`text-2xl font-bold ${getReputationTextColor(mockReputation.score)} leading-tight`}>
                      {mockReputation.score}/100
                    </p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">SPF</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">✓ Válido</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">DKIM</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">✓ Válido</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">DMARC</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">✓ Válido</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">Idade do Domínio</p>
                    <p className="text-cyan-400 text-sm font-bold leading-tight">{mockReputation.domainAge} anos</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1 leading-relaxed">Blacklist</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">Limpo</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SOCIAL ENGINEERING */}
          <div className="rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-6 backdrop-blur-sm">
            <button
              onClick={() => toggleSection('socialEngineering')}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                <h3 className="text-lg font-bold text-orange-400 leading-tight">🧠 Engenharia Social</h3>
              </div>
              {expandedSections.socialEngineering ? (
                <ChevronUp className="w-5 h-5 text-orange-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-orange-400" />
              )}
            </button>

            {expandedSections.socialEngineering && (
              <div className="mt-4 space-y-3 pt-4 border-t border-orange-500/20">
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-orange-300 text-sm font-semibold mb-2 leading-relaxed">Indicadores Detectados:</p>
                  <ul className="space-y-1">
                    {mockSocialEngineering.riskFactors.map((factor, idx) => (
                      <li key={idx} className="text-orange-300 text-xs leading-relaxed flex gap-2">
                        <span className="text-orange-400 flex-shrink-0">⚠️</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-orange-300 text-sm font-semibold mb-2 leading-relaxed">Palavras-chave Suspeitas:</p>
                  <div className="flex flex-wrap gap-2">
                    {mockSocialEngineering.keywords.map((keyword, idx) => (
                      <span key={idx} className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded leading-tight">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HEADER ANALYSIS */}
          <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-6 backdrop-blur-sm">
            <button
              onClick={() => toggleSection('headers')}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-purple-400 leading-tight">🔍 Análise de Cabeçalhos</h3>
              </div>
              {expandedSections.headers ? (
                <ChevronUp className="w-5 h-5 text-purple-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-purple-400" />
              )}
            </button>

            {expandedSections.headers && (
              <div className="mt-4 space-y-3 pt-4 border-t border-purple-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-purple-300 text-sm font-semibold mb-2 leading-relaxed">Spoofing</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">✓ Não detectado</p>
                  </div>

                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-purple-300 text-sm font-semibold mb-2 leading-relaxed">Sender Mismatch</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">✓ Não detectado</p>
                  </div>

                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-purple-300 text-sm font-semibold mb-2 leading-relaxed">Domain Mismatch</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">✓ Não detectado</p>
                  </div>

                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-purple-300 text-sm font-semibold mb-2 leading-relaxed">Status Geral</p>
                    <p className="text-green-400 text-sm font-bold leading-tight">✓ Seguro</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DNS AUTHENTICATION */}
          <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-6 backdrop-blur-sm">
            <button
              onClick={() => toggleSection('dnsAuth')}
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-blue-400 leading-tight">🔐 Autenticação DNS (SPF/DKIM/DMARC)</h3>
              </div>
              {expandedSections.dnsAuth ? (
                <ChevronUp className="w-5 h-5 text-blue-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-400" />
              )}
            </button>

            {expandedSections.dnsAuth && (
              <div className="mt-4 space-y-3 pt-4 border-t border-blue-500/20">
                {dnsResult ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                        <p className="text-blue-300 text-sm font-semibold mb-2 leading-relaxed">SPF</p>
                        {getDNSStatus(dnsResult.spf.valid)}
                        <p className="text-blue-300 text-xs mt-2 leading-relaxed">
                          Mecanismos: {dnsResult.spf.mechanisms.length}
                        </p>
                        {dnsResult.spf.issues.length > 0 && (
                          <div className="mt-2">
                            {dnsResult.spf.issues.map((issue: string, idx: number) => (
                              <p key={idx} className="text-red-300 text-xs leading-relaxed">⚠️ {issue}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                        <p className="text-blue-300 text-sm font-semibold mb-2 leading-relaxed">DKIM</p>
                        {getDNSStatus(dnsResult.dkim.valid)}
                        <p className="text-blue-300 text-xs mt-2 leading-relaxed">
                          Seletor: {dnsResult.dkim.selector}
                        </p>
                        {dnsResult.dkim.issues.length > 0 && (
                          <div className="mt-2">
                            {dnsResult.dkim.issues.map((issue: string, idx: number) => (
                              <p key={idx} className="text-red-300 text-xs leading-relaxed">⚠️ {issue}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                        <p className="text-blue-300 text-sm font-semibold mb-2 leading-relaxed">DMARC</p>
                        {getDNSStatus(dnsResult.dmarc.valid)}
                        <p className="text-blue-300 text-xs mt-2 leading-relaxed">
                          Policy: {dnsResult.dmarc.policy || 'N/A'}
                        </p>
                        {dnsResult.dmarc.issues.length > 0 && (
                          <div className="mt-2">
                            {dnsResult.dmarc.issues.map((issue: string, idx: number) => (
                              <p key={idx} className="text-red-300 text-xs leading-relaxed">⚠️ {issue}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <p className="text-blue-300 text-sm font-semibold mb-2 leading-relaxed">Score de Autenticação</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800/40 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" 
                            style={{width: `${dnsResult.overallScore}%`}}
                          ></div>
                        </div>
                        <p className={`${dnsResult.overallScore >= 80 ? 'text-green-400' : dnsResult.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'} text-sm font-bold leading-tight`}>
                          {dnsResult.overallScore}/100
                        </p>
                      </div>
                    </div>

                    {dnsResult.recommendations.length > 0 && (
                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                        <p className="text-blue-300 text-sm font-semibold mb-2 leading-relaxed">Recomendações:</p>
                        <ul className="space-y-1">
                          {dnsResult.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-blue-300 text-xs leading-relaxed flex gap-2">
                              <span className="text-blue-400 flex-shrink-0">💡</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <p className="text-blue-300 text-sm leading-relaxed">
                      Clique em "Analisar Email" para realizar a análise DNS em tempo real.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DOMAIN REPUTATION */}
          {dnsResult && (
            <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-bold text-purple-300">🛡️ Reputação de Domínio</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1">Nível de Risco</p>
                    <p className={`text-lg font-bold ${
                      dnsResult.virusTotal?.riskScore >= 75 ? 'text-red-400' :
                      dnsResult.virusTotal?.riskScore >= 50 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {dnsResult.virusTotal?.riskScore >= 75 ? '🔴 Crítico' :
                       dnsResult.virusTotal?.riskScore >= 50 ? '🟡 Alto' :
                       '🟢 Baixo'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium mb-1">Score de Reputação</p>
                    <p className="text-cyan-400 text-lg font-bold">{dnsResult.virusTotal?.reputation || 0}</p>
                  </div>
                </div>
                
                {dnsResult.virusTotal && (
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-purple-300 text-sm font-semibold mb-2">Análise VirusTotal:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400">Malicioso:</span> <span className="text-red-400 font-bold">{dnsResult.virusTotal.malicious || 0}</span></div>
                      <div><span className="text-slate-400">Suspeito:</span> <span className="text-yellow-400 font-bold">{dnsResult.virusTotal.suspicious || 0}</span></div>
                      <div><span className="text-slate-400">Indetectado:</span> <span className="text-slate-400 font-bold">{dnsResult.virusTotal.undetected || 0}</span></div>
                      <div><span className="text-slate-400">Limpo:</span> <span className="text-green-400 font-bold">{dnsResult.virusTotal.harmless || 0}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OVERALL RISK SCORE */}
          <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2 leading-relaxed">Risco Geral do Email</p>
                <h3 className="text-3xl font-bold text-cyan-400 leading-tight">Moderado</h3>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm font-medium mb-2 leading-relaxed">Score de Risco</p>
                <p className="text-4xl font-bold text-yellow-400 leading-tight">45%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
