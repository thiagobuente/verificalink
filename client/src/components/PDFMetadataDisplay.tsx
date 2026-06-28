/**
 * PDF Metadata Display Component
 * Shows extracted metadata from PDF documents with risk analysis
 */

import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info, Calendar, User, FileText, Settings } from 'lucide-react';

interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  trapped?: boolean;
  encrypted?: boolean;
  pageCount?: number;
}

interface PDFMetadataAnalysis {
  metadata: PDFMetadata;
  riskFactors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousPatterns: string[];
  recommendations: string[];
}

interface PDFMetadataDisplayProps {
  analysis: PDFMetadataAnalysis;
  isLoading?: boolean;
}

const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'critical':
      return 'from-red-600/20 to-red-900/20 border-red-500/30 text-red-400';
    case 'high':
      return 'from-orange-600/20 to-orange-900/20 border-orange-500/30 text-orange-400';
    case 'medium':
      return 'from-yellow-600/20 to-yellow-900/20 border-yellow-500/30 text-yellow-400';
    case 'low':
      return 'from-green-600/20 to-green-900/20 border-green-500/30 text-green-400';
    default:
      return 'from-slate-600/20 to-slate-900/20 border-slate-500/30 text-slate-400';
  }
};

const getRiskIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical':
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    case 'high':
      return <AlertCircle className="w-5 h-5 text-orange-400" />;
    case 'medium':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'low':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    default:
      return <Info className="w-5 h-5 text-slate-400" />;
  }
};

const getRiskLabel = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'critical':
      return 'CRÍTICO';
    case 'high':
      return 'ALTO';
    case 'medium':
      return 'MÉDIO';
    case 'low':
      return 'BAIXO';
    default:
      return 'DESCONHECIDO';
  }
};

const formatDate = (date?: Date): string => {
  if (!date) return 'Não disponível';
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const PDFMetadataDisplay: React.FC<PDFMetadataDisplayProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-slate-700/50 rounded-lg"></div>
        <div className="h-40 bg-slate-700/50 rounded-lg"></div>
      </div>
    );
  }

  const { metadata, riskFactors, riskLevel, suspiciousPatterns, recommendations } = analysis;

  return (
    <div className="space-y-6">
      {/* Risk Summary Card */}
      <div
        className={`bg-gradient-to-br ${getRiskColor(riskLevel)} border rounded-lg p-6 backdrop-blur-sm`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {getRiskIcon(riskLevel)}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Análise de Metadados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Fatores de Risco</p>
                  <p className="text-xl font-bold text-cyan-400">{riskFactors.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Padrões Suspeitos</p>
                  <p className="text-xl font-bold text-cyan-400">{suspiciousPatterns.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Páginas</p>
                  <p className="text-xl font-bold text-cyan-400">{metadata.pageCount || '?'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Criptografado</p>
                  <p className="text-xl font-bold text-cyan-400">{metadata.encrypted ? '🔒 Sim' : '🔓 Não'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Nível de Risco</p>
            <p className="text-2xl font-bold text-white">{getRiskLabel(riskLevel)}</p>
          </div>
        </div>
      </div>

      {/* Metadata Details */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 space-y-4">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Informações do Documento</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Título</span>
            </div>
            <p className="text-slate-200 break-words">{metadata.title || 'Não definido'}</p>
          </div>

          {/* Author */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Autor</span>
            </div>
            <p className="text-slate-200 break-words">{metadata.author || 'Não identificado'}</p>
          </div>

          {/* Creator Software */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Software Criador</span>
            </div>
            <p className="text-slate-200 break-words">{metadata.creator || 'Desconhecido'}</p>
          </div>

          {/* Producer Software */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Software Produtor</span>
            </div>
            <p className="text-slate-200 break-words">{metadata.producer || 'Desconhecido'}</p>
          </div>

          {/* Creation Date */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Data de Criação</span>
            </div>
            <p className="text-slate-200 text-sm">{formatDate(metadata.creationDate)}</p>
          </div>

          {/* Modification Date */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Data de Modificação</span>
            </div>
            <p className="text-slate-200 text-sm">{formatDate(metadata.modificationDate)}</p>
          </div>

          {/* Subject */}
          {metadata.subject && (
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-semibold">Assunto</span>
              </div>
              <p className="text-slate-200 break-words">{metadata.subject}</p>
            </div>
          )}

          {/* Keywords */}
          {metadata.keywords && (
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-semibold">Palavras-chave</span>
              </div>
              <p className="text-slate-200 break-words text-sm">{metadata.keywords}</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Fatores de Risco Detectados</h4>
          <div className="space-y-2">
            {riskFactors.map((factor, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <span className="text-lg mt-0.5">⚠️</span>
                <span className="text-slate-300 text-sm">{factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspicious Patterns */}
      {suspiciousPatterns.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Padrões Suspeitos</h4>
          <div className="space-y-2">
            {suspiciousPatterns.map((pattern, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <span className="text-lg mt-0.5">🔍</span>
                <span className="text-slate-300 text-sm">{pattern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 space-y-3">
          <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Recomendações</h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-lg mt-0.5">💡</span>
                <span className="text-blue-300 text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {riskFactors.length === 0 && suspiciousPatterns.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
          <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-400" />
          <p className="text-green-400 font-semibold">Metadados Normais</p>
          <p className="text-green-300 text-sm mt-1">Nenhum padrão suspeito detectado nos metadados do PDF</p>
        </div>
      )}
    </div>
  );
};

export default PDFMetadataDisplay;
