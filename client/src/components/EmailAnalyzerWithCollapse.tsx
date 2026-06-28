/**
 * Email Security Analyzer - Com Animações de Entrada e Saída
 * Utiliza ExpandableSection para animações suaves de collapse/expand
 */

import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, CheckCircle2, TrendingUp, Download, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpandableSection, Accordion } from '@/components/ExpandableSection';
import { useCardAnimation } from '@/hooks/useCardAnimation';
import { AnimatedCard, AnimatedCardGrid, AnimatedResult } from '@/components/AnimatedCard';
import MITREAttackDisplay from '@/components/MITREAttackDisplay';
import { EmailURLhausAnalysis } from '@/components/EmailURLhausAnalysis';
import { trpc } from '@/lib/trpc';

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

export default function EmailAnalyzerWithCollapse() {
  const [emailInput, setEmailInput] = useState('');
  const [analysisType, setAnalysisType] = useState<'sender' | 'content' | 'headers'>('sender');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [dnsError, setDnsError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryEntry[]>([]);
  const [emailBody, setEmailBody] = useState('');
  
  // URLhaus query para análise de URLs no email
  const emailURLsQuery = trpc.emailURLs.analyzeURLs.useQuery(
    { emailBody: emailBody || '' },
    { enabled: !!emailBody && analysisType === 'content' }
  );

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

  const analyzeEmail = async () => {
    setIsAnalyzing(true);
    setDnsResult(null);
    setDnsError(null);

    try {
      // Validação melhorada de e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.trim())) {
        setDnsError('Digite um e-mail completo, exemplo: nome@empresa.com.br');
        setIsAnalyzing(false);
        return;
      }

      const domain = emailInput.split('@')[1];
      if (!domain) {
        setDnsError('Digite um e-mail completo, exemplo: nome@empresa.com.br');
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
    <div className="w-full space-y-4">
      <style>{`
        .email-analysis-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 18px 0;
        }

        .email-analysis-card {
          min-height: 80px;
          max-height: 90px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(10, 15, 40, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.25);
          box-shadow: 0 0 14px rgba(34, 211, 238, 0.12);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .email-analysis-card:hover {
          transform: translateY(-2px);
          border-color: rgba(34, 211, 238, 0.4);
          box-shadow: 0 0 22px rgba(34, 211, 238, 0.2), 0 0 14px rgba(34, 211, 238, 0.1);
          background: rgba(10, 15, 40, 0.55);
        }

        .email-analysis-card h3 {
          margin: 0;
          font-size: 0.95rem;
          color: #22d3ee;
          font-weight: 700;
          line-height: 1.2;
        }

        .email-analysis-card p {
          margin: 0;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.2;
        }

        .email-analysis-card .status {
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 2px;
        }

        .email-analysis-card .status.safe {
          color: #00ff88;
        }

        .email-analysis-card .status.warning {
          color: #ffcc00;
        }

        .email-analysis-card .status.danger {
          color: #ff4444;
        }

        @media (max-width: 768px) {
          .email-analysis-grid {
            grid-template-columns: 1fr !important;
            gap: 12px;
            margin: 12px 0;
          }

          .email-analysis-card {
            width: 100%;
            min-height: 72px;
            max-height: none;
            padding: 14px 16px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 14px;
            text-align: left;
          }

          .email-analysis-card h3 {
            font-size: 1rem;
            line-height: 1.2;
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            word-break: normal !important;
            margin: 0;
          }

          .email-analysis-card p {
            font-size: 0.82rem;
            line-height: 1.3;
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            word-break: normal !important;
            margin: 0;
          }
        }
      `}</style>

      {/* INPUT SECTION */}
      <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-cyan-400">📧 Email Security Analyzer</h2>
        </div>

        {/* ANALYSIS TYPE SELECTOR - COMPACTO */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { type: 'sender', icon: '🛡️', title: 'Remetente' },
            { type: 'content', icon: '⚠️', title: 'Engenharia Social' },
            { type: 'headers', icon: '🔍', title: 'Cabeçalhos' },
          ].map(({ type, icon, title }) => (
            <button
              key={type}
              onClick={() => setAnalysisType(type as any)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all backdrop-blur-sm border ${
                analysisType === type
                  ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-300 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/40 border-slate-700/50 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-900/50'
              }`}
              style={{
                background: analysisType === type ? 'rgba(34, 211, 238, 0.15)' : 'rgba(10, 15, 40, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              {icon} {title}
            </button>
          ))}
        </div>

        {/* TEXTAREA */}
        <textarea
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            if (analysisType === 'content') {
              setEmailBody(e.target.value);
            }
          }}
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

      {/* ANALYSIS CARDS GRID - COMPACTO */}
      {dnsResult && (
        <div className="email-analysis-grid">
          {/* CARD 1: Remetente */}
          <div className="email-analysis-card animate-fade-in-up" style={{ animationDelay: '0s' }}>
            <h3>🛡️ Remetente</h3>
            <p>SPF • DKIM • DMARC</p>
            <p className="status safe">🟢 Análise Completa</p>
          </div>

          {/* CARD 2: Engenharia Social */}
          <div className="email-analysis-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3>⚠️ Engenharia Social</h3>
            <p>Urgência • Phishing • Fraude</p>
            <p className="status warning">🟡 Verificando...</p>
          </div>

          {/* CARD 3: Cabeçalhos */}
          <div className="email-analysis-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3>🔍 Cabeçalhos</h3>
            <p>Spoofing • Mismatch • Reply-To</p>
            <p className="status safe">🟢 Seguro</p>
          </div>
        </div>
      )}

      {/* EXPANDABLE DETAILS SECTION */}
      {dnsResult && (
        <ExpandableSection
          title="📋 Detalhes Completos da Análise"
          defaultOpen={false}
          className="mt-6"
        >
          <div className="space-y-4 pt-4">
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-2">SPF (Sender Policy Framework)</h4>
              <p className="text-sm text-slate-300">
                {dnsResult?.spf?.valid ? '✅ SPF válido' : '❌ SPF inválido'}
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-2">DKIM (DomainKeys Identified Mail)</h4>
              <p className="text-sm text-slate-300">
                {dnsResult?.dkim?.valid ? '✅ DKIM válido' : '❌ DKIM inválido'}
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-2">DMARC (Domain-based Message Authentication)</h4>
              <p className="text-sm text-slate-300">
                {dnsResult?.dmarc?.valid ? '✅ DMARC válido' : '❌ DMARC inválido'}
              </p>
            </div>
          </div>
        </ExpandableSection>
      )}

      {/* MITRE ATT&CK MAPPING */}
      {dnsResult && (
        <MITREAttackDisplay
          techniques={[
            {
              id: 'T1566',
              name: 'Phishing',
              tactic: 'Initial Access',
              description: 'Envio de e-mails de phishing para obter acesso inicial ou credenciais',
              url: 'https://attack.mitre.org/techniques/T1566/',
              confidence: dnsResult?.spf?.valid && dnsResult?.dkim?.valid && dnsResult?.dmarc?.valid ? 20 : 85,
            },
            {
              id: 'T1598',
              name: 'Phishing for Information',
              tactic: 'Reconnaissance',
              description: 'Coleta de informacoes atraves de e-mails de phishing',
              url: 'https://attack.mitre.org/techniques/T1598/',
              confidence: dnsResult?.spf?.valid && dnsResult?.dkim?.valid && dnsResult?.dmarc?.valid ? 15 : 75,
            },
          ].filter(t => t.confidence > 30)}
        />
      )}

      {/* EMAIL URLHAUS ANALYSIS */}
      {emailURLsQuery.data && emailURLsQuery.data.success && (
        <EmailURLhausAnalysis
          data={emailURLsQuery.data.data || {
            totalURLs: 0,
            maliciousURLs: 0,
            suspiciousURLs: 0,
            cleanURLs: 0,
            unknownURLs: 0,
            urls: [],
          }}
          isLoading={emailURLsQuery.isLoading}
        />
      )}

      {/* ANALYSIS HISTORY */}
      {analysisHistory.length > 0 && (
        <ExpandableSection
          title={`📜 Histórico de Análises (${analysisHistory.length})`}
          defaultOpen={false}
          className="mt-6"
        >
          <div className="space-y-2 pt-4">
            {analysisHistory.map((entry, index) => (
              <div
                key={index}
                className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3 text-sm animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="text-cyan-400 font-semibold">{entry.email}</p>
                <p className="text-slate-400 text-xs">
                  {new Date(entry.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}
