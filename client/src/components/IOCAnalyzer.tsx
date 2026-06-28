/**
 * IOC Analyzer Component
 * Análise de indicadores de comprometimento
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Search, Copy, Download } from 'lucide-react';
import { SkeletonAnalysis } from './SkeletonLoader';

interface SourceAnalysis {
  source: string;
  status: 'malicious' | 'suspicious' | 'clean' | 'no_data';
  details: string;
  confidence: number;
  lastUpdated?: number;
}

interface IOCAnalysisResult {
  ioc: {
    value: string;
    type: string;
    confidence: number;
  };
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean';
  confidence: number;
  sources: SourceAnalysis[];
  reasons: string[];
  recommendation: string;
  timestamp: number;
}

export const IOCAnalyzer: React.FC = () => {
  const [iocInput, setIocInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IOCAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<IOCAnalysisResult[]>([]);
  const [expandedSources, setExpandedSources] = useState(false);

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ioc_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load IOC history:', e);
      }
    }
  }, []);

  const analyzeIOC = async () => {
    if (!iocInput.trim()) {
      setError('Por favor, insira um indicador de comprometimento');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-ioc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ioc: iocInput.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao analisar IOC');
      }

      const data: IOCAnalysisResult = await response.json();
      setResult(data);

      // Salvar no histórico
      const newHistory = [data, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('ioc_history', JSON.stringify(newHistory));

      setIocInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      case 'clean':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
      case 'medium':
        return <AlertCircle className="w-5 h-5" />;
      case 'low':
        return <AlertCircle className="w-5 h-5" />;
      case 'clean':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getSourceStatusIcon = (status: string) => {
    switch (status) {
      case 'malicious':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'suspicious':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'clean':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadReport = () => {
    if (!result) return;

    const report = `
IOC Analysis Report
==================

IOC Value: ${result.ioc.value}
IOC Type: ${result.ioc.type.toUpperCase()}
Risk Level: ${result.riskLevel.toUpperCase()}
Risk Score: ${result.riskScore}/100
Confidence: ${result.confidence}%

Recommendation:
${result.recommendation}

Reasons:
${result.reasons.map(r => `- ${r}`).join('\n')}

Sources Consulted:
${result.sources.map(s => `- ${s.source}: ${s.status} (${s.confidence}% confidence) - ${s.details}`).join('\n')}

Analysis Date: ${new Date(result.timestamp).toLocaleString()}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ioc-report-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-cyan-400" />
          🔍 IOC Analyzer
        </h2>
        <p className="text-gray-400 text-sm sm:text-base">
          Analise indicadores de comprometimento: IPs, domínios, URLs, hashes e emails
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <textarea
          value={iocInput}
          onChange={e => setIocInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !e.shiftKey && analyzeIOC()}
          placeholder="Cole um indicador de comprometimento (IP, domínio, URL, hash MD5/SHA1/SHA256 ou email)..."
          className="w-full p-3 sm:p-4 bg-gray-900 border border-gray-700 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
          rows={3}
        />
        <button
          onClick={analyzeIOC}
          disabled={loading || !iocInput.trim()}
          className="w-full py-2 sm:py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 text-white font-semibold text-sm sm:text-base rounded-lg transition-colors"
        >
          {loading ? '⏳ Analisando...' : '🔍 Analisar IOC'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <SkeletonAnalysis />
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Risk Summary */}
          <div className={`p-4 sm:p-6 rounded-lg border ${getRiskColor(result.riskLevel)} border-opacity-30 animate-fade-in-up`} style={{animationDelay: '0s'}}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-start gap-3">
                {getRiskIcon(result.riskLevel)}
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {result.riskLevel.toUpperCase()}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-75">
                    Score: {result.riskScore}/100 | Confiança: {result.confidence}%
                  </p>
                </div>
              </div>
              <div className="text-right text-xs sm:text-sm opacity-75">
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          {/* IOC Details */}
          <div className="p-3 sm:p-4 bg-gray-900 border border-gray-700 rounded-lg space-y-3 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Tipo de IOC</p>
                <p className="text-white font-mono text-base sm:text-lg">{result.ioc.type.toUpperCase()}</p>
              </div>
              <button
                onClick={() => copyToClipboard(result.ioc.value)}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
                title="Copiar"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-2 sm:p-3 bg-gray-800 rounded font-mono text-xs sm:text-sm text-gray-300 break-all">
              {result.ioc.value}
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-3 sm:p-4 bg-blue-900/20 border border-blue-700 rounded-lg text-blue-300 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <p className="font-semibold mb-2 text-sm sm:text-base">💡 Recomendação:</p>
            <p className="text-sm sm:text-base">{result.recommendation}</p>
          </div>

          {/* Reasons */}
          <div className="p-3 sm:p-4 bg-gray-900 border border-gray-700 rounded-lg animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <p className="font-semibold text-white mb-3 text-sm sm:text-base">📋 Motivos da Análise:</p>
            <ul className="space-y-2">
              {result.reasons.map((reason, idx) => (
                <li key={idx} className="text-gray-300 text-xs sm:text-sm flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div className="p-3 sm:p-4 bg-gray-900 border border-gray-700 rounded-lg animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <button
              onClick={() => setExpandedSources(!expandedSources)}
              className="w-full flex items-center justify-between font-semibold text-white hover:text-cyan-400 transition-colors text-sm sm:text-base"
            >
              <span>🔗 Fontes Consultadas ({result.sources.length})</span>
              <span>{expandedSources ? '▼' : '▶'}</span>
            </button>

            {expandedSources && (
              <div className="mt-4 space-y-3">
                {result.sources.map((source, idx) => (
                  <div key={idx} className="p-2 sm:p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getSourceStatusIcon(source.status)}
                        <span className="font-semibold text-white text-sm sm:text-base">{source.source}</span>
                      </div>
                      <span className="text-xs text-gray-400">{source.confidence}% confiança</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300">{source.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className="text-cyan-400">{source.status}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Download */}
          <button
            onClick={downloadReport}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            📥 Baixar Relatório
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && !result && (
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="font-semibold text-white mb-3">📜 Histórico Recente:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.slice(0, 5).map((h, idx) => (
              <button
                key={idx}
                onClick={() => setResult(h)}
                className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded text-left text-sm text-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono truncate">{h.ioc.value}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    h.riskLevel === 'clean' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {h.riskLevel}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IOCAnalyzer;
