/**
 * PDF Analyzer Component
 * Analyzes PDF documents for URLs and threats using URLhaus
 */

import React, { useState, useRef } from 'react';
import { Upload, FileIcon, AlertTriangle, CheckCircle2, Loader, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { LoadingAnimation } from './LoadingAnimation';
import PDFURLhausAnalysis from './PDFURLhausAnalysis';
import PDFMetadataDisplay from './PDFMetadataDisplay';
import VirusTotalAnalysis from './VirusTotalAnalysis';
import * as pdfjsLib from 'pdfjs-dist';
import { analyzePDFMetadata } from '@/lib/pdfMetadataAnalyzer';
import { calculateSHA256 } from '@/lib/hashCalculator';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

interface PDFAnalysisResult {
  filename: string;
  filesize: number;
  totalPages: number;
  extractedText: string;
  metadata?: PDFMetadata;
  analysisComplete: boolean;
}

interface PDFAnalyzerProps {
  onAnalysisComplete?: (result: any) => void;
}

export const PDFAnalyzer: React.FC<PDFAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'extracting' | 'analyzing' | 'complete'>('extracting');
  const [pdfData, setPdfData] = useState<PDFAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [virusTotalResult, setVirusTotalResult] = useState<any | null>(null);
  const [isCheckingVirusTotal, setIsCheckingVirusTotal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for PDFs

  // tRPC mutation para análise de URLs em PDF
  const pdfURLAnalysis = trpc.pdfURLs.analyzeURLs.useQuery(
    {
      pdfText: pdfData?.extractedText || '',
      totalPages: pdfData?.totalPages || 1,
    },
    {
      enabled: !!pdfData?.extractedText && analysisStep === 'analyzing',
    }
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Extract metadata from PDF using pdf.js
   */
  const extractMetadataFromPDF = async (file: File): Promise<PDFMetadata> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const metadata = await pdf.getMetadata();

    const info = (metadata.info || {}) as Record<string, any>;
    const params = (metadata as { params?: Record<string, any> }).params || {};

    return {
      title: info.Title || undefined,
      author: info.Author || undefined,
      subject: info.Subject || undefined,
      keywords: info.Keywords || undefined,
      creator: info.Creator || undefined,
      producer: info.Producer || undefined,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
      trapped: info.Trapped || false,
      encrypted: params.encrypted || false,
      pageCount: pdf.numPages,
    };
  };

  /**
   * Extract text from PDF using pdf.js
   */
  const extractTextFromPDF = async (file: File): Promise<{ text: string; pages: number }> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const pageCount = pdf.numPages;

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .join(' ');
      fullText += `\n--- Página ${i} ---\n${pageText}`;
    }

    return { text: fullText, pages: pageCount };
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setPdfData(null);
    setAnalysisStep('extracting');

    // Validações
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `Arquivo muito grande. Máximo: 50MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Por favor, selecione um arquivo PDF válido');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Extract text and metadata from PDF
      const { text, pages } = await extractTextFromPDF(file);
      const metadata = await extractMetadataFromPDF(file);
      
      // Calculate SHA-256 hash
      const hash = await calculateSHA256(file);
      setFileHash(hash);

      const result: PDFAnalysisResult = {
        filename: file.name,
        filesize: file.size,
        totalPages: pages,
        extractedText: text,
        metadata,
        analysisComplete: false,
      };

      setPdfData(result);
      setAnalysisStep('analyzing');
      
      // Check VirusTotal after a short delay
      setTimeout(() => {
        setIsCheckingVirusTotal(true);
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao extrair texto do PDF. Tente outro arquivo.'
      );
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setPdfData(null);
    setError(null);
    setAnalysisStep('extracting');
    setIsAnalyzing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-cyan-400">📄 Analisador de PDF</h3>
      </div>

      {!pdfData ? (
        <>
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf"
            />

            <FileIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-300 font-bold mb-2 text-lg">
              Arraste um PDF aqui ou clique para selecionar
            </p>
            <p className="text-slate-500 text-sm">Máximo: 50MB | Formato: PDF</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm font-bold mb-1">❌ Erro:</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-400 font-bold text-sm mb-2">💡 Como funciona:</p>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>✓ Envie um documento PDF para análise</li>
              <li>✓ Extraímos automaticamente todas as URLs do documento</li>
              <li>✓ Verificamos cada URL contra URLhaus para detectar ameaças</li>
              <li>✓ Receba um relatório detalhado com status de cada link</li>
              <li>✓ Identifique PDFs maliciosos ou com links suspeitos</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          {/* PDF Info Card */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-bold text-white text-lg">{pdfData.filename}</p>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-slate-400">Tamanho:</span>
                    <p className="font-mono text-cyan-400">{formatFileSize(pdfData.filesize)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Páginas:</span>
                    <p className="font-mono text-cyan-400">{pdfData.totalPages}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <p className="font-mono text-cyan-400">
                      {analysisStep === 'complete' ? '✅ Completo' : '⏳ Analisando...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Animation */}
          {analysisStep !== 'complete' && (
            <LoadingAnimation isLoading={isAnalyzing} analysisType="pdf" />
          )}

          {/* Metadata Display */}
          {analysisStep === 'complete' && pdfData.metadata && (
            <PDFMetadataDisplay 
              analysis={analyzePDFMetadata(pdfData.metadata)} 
              isLoading={false} 
            />
          )}

          {/* VirusTotal Analysis */}
          {analysisStep === 'complete' && fileHash && virusTotalResult && (
            <VirusTotalAnalysis 
              result={virusTotalResult.data} 
              fileHash={fileHash}
              isLoading={false}
            />
          )}

          {isCheckingVirusTotal && analysisStep === 'analyzing' && fileHash && (
            <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6 text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
              <p className="text-slate-300 font-bold">Verificando VirusTotal...</p>
              <p className="text-slate-500 text-sm mt-2">Consultando banco de dados de malware</p>
            </div>
          )}

          {/* URLhaus Analysis Results */}
          {analysisStep === 'complete' && pdfURLAnalysis.data?.data && (
            <PDFURLhausAnalysis data={pdfURLAnalysis.data.data as any} isLoading={false} />
          )}

          {/* Error in Analysis */}
          {pdfURLAnalysis.error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 font-bold text-sm mb-1">❌ Erro na Análise:</p>
              <p className="text-red-300 text-sm">
                {pdfURLAnalysis.error instanceof Error
                  ? pdfURLAnalysis.error.message
                  : 'Erro ao analisar URLs do PDF'}
              </p>
            </div>
          )}

          {/* New Analysis Button */}
          <button
            onClick={handleNewAnalysis}
            className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
          >
            Analisar Outro PDF
          </button>
        </>
      )}

      {/* Loading State */}
      {isAnalyzing && analysisStep === 'extracting' && (
        <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          <p className="text-slate-300 font-bold">Extraindo texto do PDF...</p>
          <p className="text-slate-500 text-sm mt-2">Por favor, aguarde</p>
        </div>
      )}
    </div>
  );
};

export default PDFAnalyzer;
