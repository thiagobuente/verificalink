import React, { useState, useEffect } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

interface LoadingAnimationProps {
  isLoading: boolean;
  analysisType?: 'link' | 'email' | 'qrcode' | 'pdf' | 'screenshot' | 'ioc';
}

const statusMessages = {
  link: [
    { text: '🔗 Verificando domínio...', icon: Search, delay: 0 },
    { text: '🛡️ Analisando ameaças...', icon: AlertTriangle, delay: 1500 },
    { text: '📊 Consultando fontes...', icon: Zap, delay: 3000 },
    { text: '✅ Gerando relatório...', icon: CheckCircle2, delay: 4500 },
  ],
  email: [
    { text: '📧 Analisando remetente...', icon: Search, delay: 0 },
    { text: '🔐 Verificando autenticação...', icon: AlertTriangle, delay: 1500 },
    { text: '⚠️ Detectando phishing...', icon: Zap, delay: 3000 },
    { text: '✅ Gerando parecer...', icon: CheckCircle2, delay: 4500 },
  ],
  qrcode: [
    { text: '📱 Decodificando QR Code...', icon: Search, delay: 0 },
    { text: '🔗 Extraindo URL...', icon: AlertTriangle, delay: 1500 },
    { text: '🛡️ Analisando destino...', icon: Zap, delay: 3000 },
    { text: '✅ Resultado pronto...', icon: CheckCircle2, delay: 4500 },
  ],
  pdf: [
    { text: '📄 Lendo arquivo...', icon: Search, delay: 0 },
    { text: '🔍 Analisando conteúdo...', icon: AlertTriangle, delay: 1500 },
    { text: '⚠️ Detectando ameaças...', icon: Zap, delay: 3000 },
    { text: '✅ Análise concluída...', icon: CheckCircle2, delay: 4500 },
  ],
  screenshot: [
    { text: '🖼️ Processando imagem...', icon: Search, delay: 0 },
    { text: '🔤 Extraindo texto (OCR)...', icon: AlertTriangle, delay: 1500 },
    { text: '🎯 Detectando padrões...', icon: Zap, delay: 3000 },
    { text: '✅ Análise finalizada...', icon: CheckCircle2, delay: 4500 },
  ],
  ioc: [
    { text: '🔎 Validando indicador...', icon: Search, delay: 0 },
    { text: '📡 Consultando bases...', icon: AlertTriangle, delay: 1500 },
    { text: '⚠️ Verificando reputação...', icon: Zap, delay: 3000 },
    { text: '✅ Resultado disponível...', icon: CheckCircle2, delay: 4500 },
  ],
};

export function LoadingAnimation({ isLoading, analysisType = 'link' }: LoadingAnimationProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const messages = statusMessages[analysisType];

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0);
      setProgress(0);
      return;
    }

    // Update current message based on time
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    return () => clearInterval(messageInterval);
  }, [isLoading, messages.length]);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(progressInterval);
  }, [isLoading]);

  if (!isLoading) return null;

  const currentMessage = messages[currentMessageIndex];
  const IconComponent = currentMessage.icon;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      {/* Animated Shield Icon */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse"></div>
        <div className="absolute inset-2 rounded-full border-2 border-cyan-500/40 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-10 h-10 text-cyan-400" />
        </div>
      </div>

      {/* Status Message with Fade Transition */}
      <div className="h-8 flex items-center justify-center">
        <div
          className="flex items-center gap-2 text-lg font-semibold text-cyan-300 transition-all duration-500"
          style={{
            opacity: 1,
            animation: 'fadeInOut 1.5s ease-in-out infinite',
          }}
        >
          <IconComponent className="w-5 h-5 animate-pulse" />
          <span>{currentMessage.text}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden border border-cyan-500/20">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          {Math.round(Math.min(progress, 100))}%
        </p>
      </div>

      {/* Dots Animation */}
      <div className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <div
            key={dot}
            className="w-2 h-2 rounded-full bg-cyan-400"
            style={{
              animation: `bounce 1.4s infinite`,
              animationDelay: `${dot * 0.2}s`,
            }}
          ></div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
