import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PDFProgressDialogProps {
  isOpen: boolean;
  progress: number;
  status: 'preparing' | 'generating' | 'finalizing' | 'complete';
}

export default function PDFProgressDialog({ isOpen, progress, status }: PDFProgressDialogProps) {
  if (!isOpen) return null;

  const statusMessages = {
    preparing: 'Preparando dados da análise...',
    generating: 'Gerando documento PDF...',
    finalizing: 'Finalizando PDF...',
    complete: 'PDF gerado com sucesso!'
  };

  const statusColors = {
    preparing: 'from-blue-500 to-blue-600',
    generating: 'from-cyan-500 to-blue-500',
    finalizing: 'from-green-500 to-cyan-500',
    complete: 'from-green-500 to-green-600'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Exportando PDF</h3>
        </div>

        {/* Status Message */}
        <p className="text-gray-300 text-sm mb-6 text-center">
          {statusMessages[status]}
        </p>

        {/* Progress Bar Container */}
        <div className="mb-6">
          {/* Outer container with border */}
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700 shadow-inner">
            {/* Progress bar with gradient */}
            <div
              className={`h-full bg-gradient-to-r ${statusColors[status]} transition-all duration-500 ease-out shadow-lg`}
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            </div>
          </div>

          {/* Percentage text */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">Progresso</span>
            <span className={`text-sm font-bold ${
              status === 'complete' ? 'text-green-400' : 'text-cyan-400'
            }`}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="space-y-2 mb-6">
          {/* Step 1: Preparing */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              progress >= 25
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {progress >= 25 ? '✓' : '1'}
            </div>
            <span className={`text-sm ${
              progress >= 25 ? 'text-green-400' : 'text-gray-400'
            }`}>
              Preparando dados
            </span>
          </div>

          {/* Step 2: Generating */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              progress >= 50
                ? 'bg-green-500 text-white'
                : progress >= 25
                ? 'bg-cyan-500 text-white animate-pulse'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {progress >= 50 ? '✓' : '2'}
            </div>
            <span className={`text-sm ${
              progress >= 25 ? 'text-gray-300' : 'text-gray-500'
            }`}>
              Gerando documento
            </span>
          </div>

          {/* Step 3: Finalizing */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              progress >= 75
                ? 'bg-green-500 text-white'
                : progress >= 50
                ? 'bg-cyan-500 text-white animate-pulse'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {progress >= 75 ? '✓' : '3'}
            </div>
            <span className={`text-sm ${
              progress >= 50 ? 'text-gray-300' : 'text-gray-500'
            }`}>
              Finalizando
            </span>
          </div>

          {/* Step 4: Complete */}
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              progress >= 100
                ? 'bg-green-500 text-white'
                : progress >= 75
                ? 'bg-cyan-500 text-white animate-pulse'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {progress >= 100 ? '✓' : '4'}
            </div>
            <span className={`text-sm ${
              progress >= 75 ? 'text-gray-300' : 'text-gray-500'
            }`}>
              Pronto para download
            </span>
          </div>
        </div>

        {/* Info message */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            Não feche esta janela durante a geração do PDF
          </p>
        </div>
      </div>
    </div>
  );
}
