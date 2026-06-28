/**
 * Email Security Analyzer - Com Animações de Entrada
 * Glassmorphism + Cyberpunk + Professional Threat Intelligence
 */

import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCardAnimation } from '@/hooks/useCardAnimation';

interface DNSAuthentication {
  domain: string;
  spf: { valid: boolean; record: string | null; mechanisms: string[]; issues: string[] };
  dkim: { valid: boolean; record: string | null; selector: string; issues: string[] };
  dmarc: { valid: boolean; record: string | null; policy: 'none' | 'quarantine' | 'reject' | null; issues: string[] };
  overallScore: number;
  recommendations: string[];
}

interface AnalysisHistoryEntry {
  email: string;
  timestamp: string;
  result: any;
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

export default function EmailAnalyzerAnimated() {
  const [emailInput, setEmailInput] = useState('');
  const [analysisType, setAnalysisType] = useState<'sender' | 'content' | 'headers'>('sender');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [dnsError, setDnsError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryEntry[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    reputation: true,
    socialEngineering: false,
    headers: false,
  });

  // Animações para os cards
  const card1Animation = useCardAnimation({ triggerAnimation: !!dnsResult, staggerIndex: 0 });
  const card2Animation = useCardAnimation({ triggerAnimation: !!dnsResult, staggerIndex: 1 });
  const card3Animation = useCardAnimation({ triggerAnimation: !!dnsResult, staggerIndex: 2 });
  const detailsAnimation = useCardAnimation({ triggerAnimation: !!dnsResult, staggerIndex: 3 });

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
      const domain = emailInput.split('@')[1];
      if (!domain) {
        setDnsError('Email inválido');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch('/api/analyze-dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, dkimSelector: 'default' }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setDnsResult(result.data);
        const historyEntry = {
          email: emailInput,
          timestamp: new Date().toISOString(),
          result: result.data,
        };
        const updatedHistory = [historyEntry, ...analysisHistory].slice(0, 10);
        setAnalysisHistory(updatedHistory);
        try {
          localStorage.setItem('emailAnalysisHistory', JSON.stringify(updatedHistory));
        } catch (error) {
          console.error('Erro ao salvar histórico:', error);
        }
      } else {
        setDnsError(result.error || 'Erro ao analisar DNS');
      }
    } catch (error) {
      setDnsError(error instanceof Error ? error.message : 'Erro ao analisar DNS');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* INPUT SECTION */}
      <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-cyan-400">📧 Email Security Analyzer</h2>
        </div>

        {/* ANALYSIS TYPE SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {[
            { type: 'sender', icon: '🛡️', title: 'Remetente', desc: 'SPF, DKIM, DMARC' },
            { type: 'content', icon: '⚠️', title: 'Engenharia Social', desc: 'Conteúdo suspeito' },
            { type: 'headers', icon: '🔍', title: 'Cabeçalhos', desc: 'Spoofing, Mismatch' },
          ].map(({ type, icon, title, desc }) => (
            <button
              key={type}
              onClick={() => setAnalysisType(type as any)}
              className={`p-3 rounded-lg transition-all ${
                analysisType === type
                  ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-cyan-500/50'
              }`}
            >
              <p className="text-sm font-semibold">{icon} {title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </button>
          ))}
        </div>

        {/* TEXTAREA */}
        <textarea
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder={
            analysisType === 'sender'
              ? 'Cole o endereço de email (ex: remetente@empresa.com)'
              : analysisType === 'content'
                ? 'Cole o conteúdo do email para análise'
                : 'Cole os cabeçalhos completos do email'
          }
          className="w-full h-32 bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
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
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-fade-in">
            <p className="text-red-300 text-sm">❌ {dnsError}</p>
          </div>
        )}
      </div>

      {/* ANALYSIS CARDS GRID - COM ANIMAÇÕES */}
      {emailInput && (
        <div className="space-y-4">
          {/* STATUS CARDS GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            margin: '20px 0',
          }}>
            {/* CARD 1: REMETENTE */}
            <div
              ref={card1Animation.elementRef}
              className={`${card1Animation.animationClass} ${card1Animation.staggerClass}`}
              style={{
                minHeight: '90px',
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(10,15,40,.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(34,211,238,.25)',
                boxShadow: '0 0 12px rgba(34,211,238,.15), 0 0 30px rgba(34,211,238,.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '6px',
                textAlign: 'left',
                transition: 'all .3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(34,211,238,.25), 0 0 40px rgba(34,211,238,.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(34,211,238,.15), 0 0 30px rgba(34,211,238,.08)';
              }}
              onClick={() => toggleSection('reputation')}
            >
              <h3 style={{ margin: 0, color: '#22d3ee', fontSize: '1rem', fontWeight: 700 }}>
                🛡️ Remetente
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,.75)', fontSize: '.85rem' }}>
                SPF • DKIM • DMARC
              </p>
              <p style={{ margin: 0, color: '#00ff88', fontSize: '.85rem', fontWeight: 600 }}>
                {dnsResult ? '🟢 Análise Completa' : '⏳ Aguardando análise'}
              </p>
            </div>

            {/* CARD 2: ENGENHARIA SOCIAL */}
            <div
              ref={card2Animation.elementRef}
              className={`${card2Animation.animationClass} ${card2Animation.staggerClass}`}
              style={{
                minHeight: '90px',
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(10,15,40,.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(34,211,238,.25)',
                boxShadow: '0 0 12px rgba(34,211,238,.15), 0 0 30px rgba(34,211,238,.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '6px',
                textAlign: 'left',
                transition: 'all .3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(34,211,238,.25), 0 0 40px rgba(34,211,238,.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(34,211,238,.15), 0 0 30px rgba(34,211,238,.08)';
              }}
              onClick={() => toggleSection('socialEngineering')}
            >
              <h3 style={{ margin: 0, color: '#22d3ee', fontSize: '1rem', fontWeight: 700 }}>
                ⚠️ Engenharia Social
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,.75)', fontSize: '.85rem' }}>
                Urgência • Phishing • Fraude
              </p>
              <p style={{ margin: 0, color: '#ffcc00', fontSize: '.85rem', fontWeight: 600 }}>
                {dnsResult ? '🟡 Verificando...' : '⏳ Aguardando análise'}
              </p>
            </div>

            {/* CARD 3: CABEÇALHOS */}
            <div
              ref={card3Animation.elementRef}
              className={`${card3Animation.animationClass} ${card3Animation.staggerClass}`}
              style={{
                minHeight: '90px',
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(10,15,40,.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(34,211,238,.25)',
                boxShadow: '0 0 12px rgba(34,211,238,.15), 0 0 30px rgba(34,211,238,.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '6px',
                textAlign: 'left',
                transition: 'all .3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(34,211,238,.25), 0 0 40px rgba(34,211,238,.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(34,211,238,.15), 0 0 30px rgba(34,211,238,.08)';
              }}
              onClick={() => toggleSection('headers')}
            >
              <h3 style={{ margin: 0, color: '#22d3ee', fontSize: '1rem', fontWeight: 700 }}>
                🔍 Cabeçalhos
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,.75)', fontSize: '.85rem' }}>
                Spoofing • Mismatch • Reply-To
              </p>
              <p style={{ margin: 0, color: '#00ff88', fontSize: '.85rem', fontWeight: 600 }}>
                {dnsResult ? '🟢 Seguro' : '⏳ Aguardando análise'}
              </p>
            </div>
          </div>

          {/* DETAILED RESULTS - COM ANIMAÇÃO */}
          {dnsResult && (
            <div
              ref={detailsAnimation.elementRef}
              className={`${detailsAnimation.animationClass} ${detailsAnimation.staggerClass} space-y-4 mt-6`}
            >
              {/* DETAILED REPUTATION */}
              {expandedSections.reputation && (
                <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm animate-fade-in">
                  <h3 className="text-lg font-bold text-cyan-400 mb-4">🛡️ Detalhes de Reputação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 animate-fade-in-up animate-stagger-1">
                      <p className="text-slate-400 text-xs font-medium mb-2">SPF</p>
                      <p className={`text-sm font-bold ${dnsResult.spf?.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {dnsResult.spf?.valid ? '✓ Válido' : '✗ Inválido'}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 animate-fade-in-up animate-stagger-2">
                      <p className="text-slate-400 text-xs font-medium mb-2">DKIM</p>
                      <p className={`text-sm font-bold ${dnsResult.dkim?.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {dnsResult.dkim?.valid ? '✓ Válido' : '✗ Inválido'}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 animate-fade-in-up animate-stagger-3">
                      <p className="text-slate-400 text-xs font-medium mb-2">DMARC</p>
                      <p className={`text-sm font-bold ${dnsResult.dmarc?.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {dnsResult.dmarc?.valid ? '✓ Válido' : '✗ Inválido'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORY */}
              {analysisHistory.length > 0 && (
                <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-cyan-400">📊 Histórico</h3>
                    <span className="text-sm text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full">
                      {analysisHistory.length} análises
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analysisHistory.slice(0, 5).map((entry, idx) => (
                      <div key={idx} className={`flex items-center justify-between bg-slate-800/40 rounded-lg p-3 border border-slate-700/50 animate-fade-in-up animate-stagger-${Math.min(idx + 1, 5)}`}>
                        <p className="text-slate-300 text-sm">{entry.email}</p>
                        <span className="text-xs text-slate-500">
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
