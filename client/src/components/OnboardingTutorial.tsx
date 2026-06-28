import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle, ChevronRight, X, CheckCircle2, Link2, Mail, MessageSquare, QrCode, Shield, Lock, Search, AlertOctagon, Zap } from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "🛡️ Shield Security Scanner",
    subtitle: "Proteção inteligente contra golpes digitais",
    description: "Uma ferramenta profissional para proteger você e sua família contra golpes de WhatsApp, phishing e malware.",
    icon: <Shield className="w-12 h-12 text-cyan-400" />,
    tips: [
      "✅ Análise local - seus dados não são enviados",
      "✅ 100% gratuito - sem custo",
      "✅ Funciona offline - sem internet necessária",
    ],
  },
  {
    id: 2,
    title: "🔗 Verificar Links",
    subtitle: "Detecte URLs encurtadas e domínios falsos",
    description: "Cole um link suspeito para descobrir se é seguro ou golpe. Detecta URLs encurtadas, domínios falsos e padrões de phishing.",
    icon: <Link2 className="w-12 h-12 text-orange-400" />,
    tips: [
      "💡 Golpistas usam URLs encurtadas para esconder o destino",
      "💡 WhatsApp NUNCA pede confirmação por link",
      "💡 Desconfie de links pedindo senha ou CPF",
    ],
  },
  {
    id: 3,
    title: "📧 Verificar Emails",
    subtitle: "Identifique phishing e imitação de empresas",
    description: "Cole um email para verificar se é phishing. Detecta imitação de empresas, domínios falsos e padrões de engenharia social.",
    icon: <Mail className="w-12 h-12 text-blue-400" />,
    tips: [
      "💡 Empresas legítimas usam domínios próprios, não gratuitos",
      "💡 Desconfie de emails pedindo confirmação urgente",
      "💡 Verifique o domínio do email com cuidado",
    ],
  },
  {
    id: 4,
    title: "💬 Verificar Mensagens",
    subtitle: "Analise sinais de golpe em mensagens",
    description: "Cole uma mensagem do WhatsApp para analisar sinais de golpe. Detecta falso familiar, urgência artificial e pedidos de dinheiro.",
    icon: <AlertOctagon className="w-12 h-12 text-red-400" />,
    tips: [
      "💡 Golpe do falso familiar é muito comum",
      "💡 Sempre confirme por telefone antes de enviar dinheiro",
      "💡 Desconfie de mensagens urgentes de pessoas conhecidas",
    ],
  },
  {
    id: 5,
    title: "📱 Verificar QR Codes",
    subtitle: "Decodifique e verifique links em QR codes",
    description: "Faça upload de uma imagem com QR Code para decodificar e verificar o link contido. Detecta QR codes maliciosos.",
    icon: <QrCode className="w-12 h-12 text-purple-400" />,
    tips: [
      "💡 Golpistas usam QR codes para esconder URLs maliciosas",
      "💡 Sempre verifique antes de escanear",
      "💡 Desconfie de QR codes em mensagens suspeitas",
    ],
  },
  {
    id: 6,
    title: "✅ Resultado da Análise",
    subtitle: "Nível de risco claro com sinais detectados",
    description: "Cada análise mostra um resultado claro com o nível de risco e os sinais detectados.",
    icon: <CheckCircle2 className="w-12 h-12 text-green-400" />,
    tips: [
      "🟢 BAIXO RISCO - Provavelmente seguro",
      "🟡 RISCO MÉDIO - Tenha cuidado",
      "🔴 ALTO RISCO - Não clique/abra!",
    ],
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFinalStep = currentStep === ONBOARDING_STEPS.length;
  const progressPercent = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      setCurrentStep(currentStep + 1); // Ir para tela final
    } else if (isFinalStep) {
      handleComplete();
    } else {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(true);
      }, 200);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(true);
      }, 200);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowTutorial(false);
    onComplete();
  };

  if (!showTutorial) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm"
      style={{
        animation: isAnimating ? "fadeIn 300ms ease-out" : "fadeOut 200ms ease-in",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 229, 255, 0.8);
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .glow-button {
          animation: glow 2s ease-in-out infinite;
        }
        .slide-in {
          animation: slideIn 400ms ease-out;
        }
      `}</style>

      <Card className="w-full max-w-2xl sm:max-w-3xl mx-auto border-2 border-cyan-400 shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto" 
        style={{ 
          backgroundColor: "#081225",
          animation: isAnimating ? "fadeIn 300ms ease-out" : "fadeOut 200ms ease-in",
        }}
      >
        {/* Barra de Progresso no Topo */}
        <div className="h-1 bg-gray-700 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Tela Final */}
        {isFinalStep ? (
          <CardHeader className="bg-gradient-to-b from-cyan-500 to-blue-600 text-white relative pb-8 pt-6">
            <div className="flex flex-col items-center gap-6 text-center">
              {/* Ícone de Sucesso */}
              <div className="relative">
                <CheckCircle2 className="w-24 h-24 text-green-400 drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse" style={{ 
                  boxShadow: "0 0 40px rgba(34, 197, 94, 0.8)" 
                }} />
              </div>
              
              {/* Título */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                  Você está pronto!
                </h1>
                <p className="text-lg sm:text-xl text-green-100 font-semibold">
                  Comece a proteger você e sua família agora.
                </p>
              </div>
            </div>

            {/* Botão Fechar */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              title="Fechar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </CardHeader>
        ) : (
          <>
            {/* Header com Ícone */}
            <CardHeader className="bg-gradient-to-b from-cyan-500 to-blue-600 text-white relative pb-8 pt-6">
              <div className="flex flex-col items-center gap-4">
                {/* Ícone Animado */}
                <div className="relative slide-in">
                  {step.icon}
                  <div className="absolute inset-0 animate-pulse" style={{ 
                    boxShadow: "0 0 30px rgba(0, 229, 255, 0.6)" 
                  }} />
                </div>
                
                {/* Título e Subtítulo */}
                <div className="text-center space-y-2">
                  <h1 className="text-lg sm:text-2xl font-black text-white drop-shadow-lg leading-tight">
                    {step.title}
                  </h1>
                  <p className="text-sm sm:text-base text-cyan-100 font-semibold leading-relaxed">
                    {step.subtitle}
                  </p>
                </div>

                {/* Contador de Passos */}
                <div className="flex items-center gap-1 sm:gap-2 text-cyan-200 text-xs sm:text-sm font-mono flex-wrap justify-center">
                  <span className="hidden sm:inline font-bold">[</span>
                  {Array.from({ length: ONBOARDING_STEPS.length }).map((_, i) => (
                    <span key={i} className={i < currentStep + 1 ? "text-cyan-300 font-bold" : "text-gray-500"}>
                      {i < currentStep + 1 ? "█" : "░"}
                    </span>
                  ))}
                  <span className="hidden sm:inline font-bold">]</span>
                  <span className="font-bold text-cyan-300 ml-1 sm:ml-2">{currentStep + 1}/{ONBOARDING_STEPS.length}</span>
                </div>
              </div>

              {/* Botão Fechar */}
              <button
                onClick={handleSkip}
                className="absolute top-3 right-3 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                title="Pular tutorial"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </CardHeader>

            {/* Conteúdo */}
            <CardContent className="pt-4 sm:pt-8 space-y-3 sm:space-y-6 pb-4 sm:pb-8" style={{ backgroundColor: "#081225" }}>
              {/* Descrição */}
              <p className="text-sm sm:text-lg text-cyan-100 leading-relaxed text-center">{step.description}</p>

              {/* Dicas */}
              <div className="bg-gradient-to-br from-blue-900 to-cyan-900 p-3 sm:p-6 rounded-lg border border-cyan-400 border-opacity-50">
                <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-4 text-cyan-300">💡 Dicas:</h3>
                <div className="space-y-1 sm:space-y-3">
                  {step.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold text-base sm:text-lg flex-shrink-0">✓</span>
                      <p className="text-xs sm:text-base text-cyan-100 break-words">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-4">
                {/* Botão Próximo - Principal */}
                <Button
                  onClick={handleNext}
                  className="w-full text-xs sm:text-base py-2 sm:py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black flex items-center justify-center gap-1 sm:gap-2 shadow-lg transition-all glow-button order-first sm:order-last"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 229, 255, 0.4)"
                  }}
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="hidden sm:inline">Começar Agora!</span>
                      <span className="sm:hidden">Começar!</span>
                    </>
                  ) : (
                    <>
                      <span>Próximo</span>
                      <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" />
                    </>
                  )}
                </Button>

                {/* Botões Secundários */}
                <div className="flex gap-2 sm:gap-3">
                  {currentStep > 0 && (
                    <Button
                      onClick={handlePrev}
                      className="flex-1 text-xs py-2 sm:py-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
                    >
                      ← Voltar
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleSkip}
                    className={`${currentStep > 0 ? 'flex-1' : 'w-full'} text-xs py-2 sm:py-6 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:bg-opacity-10 font-semibold transition-all`}
                    variant="outline"
                  >
                    <span className="hidden sm:inline">Pular Tutorial</span>
                    <span className="sm:hidden">Pular</span>
                  </Button>
                </div>
              </div>

              {/* Rodapé */}
              <p className="text-center text-xs text-gray-500 mt-2">
                Você pode acessar este tutorial novamente no menu
              </p>
            </CardContent>
          </>
        )}

        {/* Tela Final - Botão */}
        {isFinalStep && (
          <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 text-center" style={{ backgroundColor: "#081225" }}>
            <Button
              onClick={handleComplete}
              className="w-full text-base sm:text-lg py-4 sm:py-6 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white font-black shadow-lg transition-all glow-button"
              style={{
                boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)"
              }}
            >
              <Zap className="w-5 h-5 mr-2 flex-shrink-0" />
              Iniciar Análise
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
