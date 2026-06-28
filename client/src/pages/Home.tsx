import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, Phone, Shield, AlertCircle, QrCode, Link2, MessageSquare, Search, Copy, Check, FileText, Heart, Lock, AlertOctagon, Share2, Mail, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import jsQR from "jsqr";
import { validarURL, bloquearHostsInternos, isPrivateIP, isDominioRecente, hasValidHTTPS, isEncurtador, exemplosGolpes } from "@/lib/security";
import { useLocation } from "wouter";
import { analyzeURLWithSecurity, getRiskColor, getRiskLabel } from "@/lib/analyzers";
import { detectarWhatsApp, urlMuitoLonga, excessoNumeros, muitosSubdominios, detectarEncurtador, calcularScore, obterNivelRisco, gerarExplicacao, validarURLCompleta, detectarPalavrasSuspeitas, isIPAddress, detectarHostInterno, gerarExplicacaoHumana, obterCorRisco, muitosHifens, detectarTLDSuspeito, gerarResumo, isTrustedDomain, extractMainDomain, detectarTyposquatting as detectarTyposquattingUrl, normalizarURL, gerarIndicadoresPositivos, ehEncurtadorConhecido, expandirURLEncurtada, detectarTLDAltoRisco, detectarPalavrasGolpeTarefa, detectarRedirecionamentoSuspeito, obterNivelRiscoNovo, obterClassificacaoReputacao, calcularRiscoComportamental, classificarRiscoComportamental, gerarMensagemAusenciaBlacklist } from "@/lib/urlDetection";
import { generateShareMessage, shareToWhatsApp, copyToClipboard, downloadReportAsText } from "@/lib/reportGenerator";
import { addToHistory, getHistory, deleteHistoryItem, clearHistory, getHistoryStats, formatDate, formatContent } from "@/lib/historyManager";
import { analisarMensagem, gerarExplicacaoMensagem, gerarResumoMensagem, obterNivelRiscoMensagem, obterCorRiscoMensagem } from "@/lib/messageAnalysis";
import { useRealtimeMessageAnalysis } from "@/hooks/useRealtimeMessageAnalysis";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Zap } from "lucide-react";
import { HistoryStats } from "@/components/HistoryStats";
import { LinkAnalyzerNeon } from "@/components/LinkAnalyzerNeon";
import { HeroSection } from "@/components/HeroSection";
import { AboutProject } from "@/components/AboutProject";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ConsultedSourcesPanel } from "@/components/ConsultedSourcesPanel";
import { useConsultedSources } from "@/hooks/useConsultedSources";
import { FAQAccordion, DEFAULT_FAQ_ITEMS } from "@/components/FAQAccordion";

import { PublicRoadmap, SourcesBadge } from "@/components/PublicRoadmap";
import { DomainAgeIndicator } from "@/components/DomainAgeIndicator";
import { ThreatIntelligenceHero } from "@/components/ThreatIntelligenceHero";
import EmailAnalyzerWithCollapse from "@/components/EmailAnalyzerWithCollapse";
import MessageAnalyzer from "@/components/MessageAnalyzer";
import ScreenshotAnalyzer from "@/components/ScreenshotAnalyzer";
import ScreenshotAnalyzerOCR from "@/components/ScreenshotAnalyzerOCR";
import IOCAnalyzer from "@/components/IOCAnalyzer";
import { ToolsNavigation } from "@/components/ToolsNavigation";
import { TabTransition, TabContainer } from "@/components/TabTransition";
import { ResponsiveResultsGrid, ResultCard } from "@/components/ResponsiveResultsGrid";
import { SkeletonAnalysis, SkeletonCard, SkeletonGrid } from "@/components/SkeletonLoader";

/**
 * Design Philosophy: Shield Security Scanner
 * - Ferramenta profissional de proteção contra golpes digitais
 * - Foco em análise inteligente e prevenção
 * - Análise local, sem coleta de dados
 * - Interface inspirada em Microsoft Defender e Cloudflare
 * - Resultado visual claro: SEGURO ou RISCO
 */

const scamPatterns = [
  { pattern: /bit\.ly|tinyurl|short\.link|goo\.gl/, name: "URL Encurtada", risk: "high", reason: "Golpistas usam URLs encurtadas para esconder o destino real" },
  { pattern: /whatsapp.*confirm|verify.*account|confirm.*identity/i, name: "Confirmação de Conta", risk: "high", reason: "WhatsApp nunca pede confirmação por link" },
  { pattern: /click.*here|clique.*aqui|toque.*aqui/i, name: "Chamada Urgente", risk: "medium", reason: "Golpistas usam linguagem urgente" },
  { pattern: /free.*money|ganhe.*dinheiro|renda.*extra|ganha.*facil/i, name: "Promessa de Dinheiro", risk: "high", reason: "Promessas de dinheiro fácil são sempre golpes" },
  { pattern: /update.*now|atualizar.*agora|download.*app|baixe.*app/i, name: "Atualização Falsa", risk: "high", reason: "Pode ser malware disfarçado de atualização" },
  { pattern: /bank|paypal|amazon|google|apple/i, name: "Imitação de Empresa", risk: "high", reason: "Golpistas fingem ser empresas conhecidas" },
  { pattern: /\.tk|\.ml|\.ga|\.cf/, name: "Domínio Suspeito", risk: "high", reason: "Domínios gratuitos são frequentemente usados em golpes" },
  { pattern: /http:\/\//i, name: "Sem Criptografia", risk: "medium", reason: "Sem HTTPS, seus dados não estão protegidos" },
];

const knownScamDomains = [
  "whatsapp-verify.com",
  "confirm-whatsapp.net",
  "update-whatsapp.xyz",
  "whatsapp-security.tk",
  "paypal-confirm.ml",
  "amazon-verify.ga",
  "bank-security.cf",
];

const knownOfficialEmails = [
  { domain: "gmail.com", company: "Google" },
  { domain: "hotmail.com", company: "Microsoft" },
  { domain: "outlook.com", company: "Microsoft" },
  { domain: "yahoo.com", company: "Yahoo" },
  { domain: "paypal.com", company: "PayPal" },
  { domain: "amazon.com", company: "Amazon" },
  { domain: "apple.com", company: "Apple" },
  { domain: "microsoft.com", company: "Microsoft" },
  { domain: "google.com", company: "Google" },
  { domain: "bancodobrasil.com.br", company: "Banco do Brasil" },
  { domain: "itau.com.br", company: "Itaú" },
  { domain: "bradesco.com.br", company: "Bradesco" },
  { domain: "caixa.gov.br", company: "Caixa" },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"pix" | "link" | "message" | "qrcode" | "pdf" | "email" | "screenshot" | "ioc" | "emergencia" | "blindar" | "sobre" | "golpes" | "como-funciona">("link");
  const [pixSubTab, setPixSubTab] = useState<"pedindo" | "golpe" | "blindar">("pedindo");
  const [isAnimating, setIsAnimating] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [linkResult, setLinkResult] = useState<any>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [messageInput, setMessageInput] = useState("");
  const [messageResult, setMessageResult] = useState<any>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageLoadingStep, setMessageLoadingStep] = useState(0);
  
  // Hook para análise em tempo real
  const { message: realtimeMessage, updateMessage: updateRealtimeMessage, analysis: realtimeAnalysis, isAnalyzing: isRealtimeAnalyzing } = useRealtimeMessageAnalysis({ debounceMs: 300 });
  const [qrResult, setQrResult] = useState<any>(null);
  const [pdfResult, setPdfResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
    // Carregar histórico ao montar o componente
    loadHistory();
  }, []);

  // Controlar animação ao trocar de aba
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab, pixSubTab]);

  const loadHistory = () => {
    const hist = getHistory();
    setHistory(hist);
    const stats = getHistoryStats();
    setHistoryStats(stats);
  };

  const saveToHistory = (result: any, type: "link" | "message" | "qrcode" | "pdf", content: string) => {
    addToHistory({
      type,
      content,
      score: result.score || 0,
      isScam: result.isScam || false,
      nivelRisco: result.nivelRisco || "Desconhecido",
      risks: result.risks || [],
      detalhes: result.detalhes
    });
    loadHistory();
  };

  const handleDeleteHistoryItem = (id: string) => {
    deleteHistoryItem(id);
    loadHistory();
  };

  const handleClearHistory = () => {
    if (window.confirm("Tem certeza que deseja limpar todo o histórico?")) {
      clearHistory();
      loadHistory();
    }
  }

  const analyzeLink = (url: string) => {
    if (!url.trim()) {
      alert("Por favor, cole um link!");
      return { url: "", score: 0, isScam: false, risks: [], nivelRisco: "seguro", resumo: "", corRisco: "green", explicacoes: [], indicadoresPositivos: [], detalhes: {} };
    }

    // Validação básica
    if (!validarURLCompleta(url)) {
      alert("URL inválida ou perigosa detectada!");
      return { url: "", score: 0, isScam: false, risks: [], nivelRisco: "seguro", resumo: "", corRisco: "green", explicacoes: [], indicadoresPositivos: [], detalhes: {} };
    }

    // Normalizar URL (adicionar https:// se necessário)
    const normalizedUrl = normalizarURL(url);

    try {
      const urlObj = new URL(normalizedUrl);
      const hostname = urlObj.hostname;

      const riscos: any = {
        blacklist: false,
        typosquatting: false,
        encurtador: false,
        dominioRecente: false,
        urlLonga: false,
        excessoNumeros: false,
        muitosSubdominios: false,
        whatsappSuspeito: false,
        hostInterno: false,
        muitosHifens: false,
        tldSuspeito: false,
        tldAltoRisco: false,
        tldAltoRiscoPontos: 0,
        palavrasGolpeTarefa: false,
        redirecionamentoSuspeito: false,
        whatsapp: false,
        trustedDomain: false
      };

      // Não tratar IP como typosquatting
      const isIP = isIPAddress(hostname);

      // CRÍTICO: Verificar se é domínio confiável PRIMEIRO
      const mainDomain = extractMainDomain(url);
      const isTrusted = isTrustedDomain(mainDomain);
      riscos.trustedDomain = isTrusted;

      // Detectar host interno
      if (detectarHostInterno(hostname)) {
        riscos.hostInterno = true;
      }

      // Detecção de WhatsApp
      if (detectarWhatsApp(url)) {
        riscos.whatsapp = true;
      }

      // Detecção de URLs encurtadas (nunca para domínios confiáveis)
      if (detectarEncurtador(url, isTrusted)) {
        riscos.encurtador = true;
        riscos.ehEncurtadorConhecido = ehEncurtadorConhecido(url);
      }

      // Detecção de URLs muito longas
      if (urlMuitoLonga(url)) {
        riscos.urlLonga = true;
      }

      // Detecção de excesso de números
      if (excessoNumeros(url)) {
        riscos.excessoNumeros = true;
      }

      // Detecção de muitos subdomínios
      if (muitosSubdominios(hostname)) {
        riscos.muitosSubdominios = true;
      }

      // Detecção de muitos hífens
      if (muitosHifens(hostname)) {
        riscos.muitosHifens = true;
      }

      // Detecção de TLD suspeito
      if (detectarTLDSuspeito(hostname)) {
        riscos.tldSuspeito = true;
      }

      // Detecção de TLD de alto risco (NOVO)
      const tldAltoRiscoResult = detectarTLDAltoRisco(hostname);
      if (tldAltoRiscoResult.isAltoRisco) {
        riscos.tldAltoRisco = true;
        riscos.tldAltoRiscoPontos = tldAltoRiscoResult.pontos;
      }

      // Detecção de palavras-chave de golpes de tarefas (NOVO)
      const palavrasGolpe = detectarPalavrasGolpeTarefa(url);
      if (palavrasGolpe.length > 0) {
        riscos.palavrasGolpeTarefa = true;
        riscos.palavrasGolpeDetectadas = palavrasGolpe;
      }

      // Detecção de redirecionamentos suspeitos (NOVO)
      if (detectarRedirecionamentoSuspeito(url)) {
        riscos.redirecionamentoSuspeito = true;
      }

      // Detecção de typosquatting (apenas se não for IP e não for domínio confiável)
      if (!isIP && !isTrusted && detectarTyposquattingUrl(hostname)) {
        riscos.typosquatting = true;
      }

      // Verificar contra padrões conhecidos de golpe
      scamPatterns.forEach(({ pattern }) => {
        if (pattern.test(url)) {
          riscos.blacklist = true;
        }
      });

      // NOVO: Calcular risco comportamental
      const riscoComportamental = calcularRiscoComportamental(normalizedUrl);
      const nivelRiscoComportamental = classificarRiscoComportamental(riscoComportamental);
      const mensagemAusenciaBlacklist = gerarMensagemAusenciaBlacklist(riscoComportamental);
      
      // Usar o maior entre o score tradicional e o risco comportamental
      const score = Math.max(calcularScore(riscos), riscoComportamental);
      const motivos = gerarExplicacao(riscos);
      const explicacoesHumanas = gerarExplicacaoHumana(riscos);
      const nivelRisco = obterNivelRiscoNovo(score); // NOVO: Usar nova escala
      const resumo = gerarResumo(nivelRisco, isTrusted, riscos);
      const corRisco = obterCorRisco(nivelRisco);
      const indicadoresPositivos = gerarIndicadoresPositivos(riscos, normalizedUrl);
      const classificacaoReputacao = obterClassificacaoReputacao(riscos, score); // NOVO: Classificação de reputação

      const result = {
        url: normalizedUrl,
        risks: motivos,
        explicacoes: explicacoesHumanas,
        indicadoresPositivos: indicadoresPositivos,
        isScam: score >= 35,
        score: score,
        nivelRisco: nivelRisco,
        resumo: resumo,
        corRisco: corRisco,
        classificacaoReputacao: classificacaoReputacao, // NOVO
        detalhes: {
          whatsapp: riscos.whatsappSuspeito,
          encurtador: riscos.encurtador,
          urlLonga: riscos.urlLonga,
          excessoNumeros: riscos.excessoNumeros,
          subdominio: riscos.muitosSubdominios,
          typosquatting: riscos.typosquatting,
          hostInterno: riscos.hostInterno,
          muitosHifens: riscos.muitosHifens,
          tldSuspeito: riscos.tldSuspeito,
          tldAltoRisco: riscos.tldAltoRisco, // NOVO
          palavrasGolpeTarefa: riscos.palavrasGolpeTarefa, // NOVO
          redirecionamentoSuspeito: riscos.redirecionamentoSuspeito // NOVO
        }
      };

      setLinkResult(result);
      saveToHistory(result, "link", url);
    } catch (error) {
      alert("Erro ao analisar URL. Verifique o formato.");
    } finally {
      setLinkLoading(false);
    }
  };

    const analyzeMessage = (message: string) => {
    if (!message.trim()) {
      alert("Por favor, cole uma mensagem!");
      return;
    }

    // Iniciar loading
    setMessageLoading(true);
    setMessageLoadingStep(0);

    // Simular progresso do loading
    const steps = [
      "🔍 Analisando texto...",
      "🔍 Detectando padrões de golpe...",
      "🔍 Verificando palavras-chave...",
      "🔍 Analisando contexto...",
      "🔍 Calculando risco..."
    ];

    let currentStep = 0;
    const loadingInterval = setInterval(() => {
      currentStep++;
      setMessageLoadingStep(Math.min(currentStep, steps.length - 1));
      if (currentStep >= steps.length) {
        clearInterval(loadingInterval);
      }
    }, 400);

    try {
      // Usar nova heurística de análise
      const analise = analisarMensagem(message);

      const result = {
        message: message,
        score: analise.score,
        nivelRisco: obterNivelRiscoMensagem(analise.score),
        isScam: analise.score >= 50,
        riscos: analise.riscos,
        padrõesDetectados: analise.padrõesDetectados,
        explicacoes: gerarExplicacaoMensagem(analise),
        resumo: gerarResumoMensagem(analise.score),
        temLink: analise.temLink,
        temTelefone: analise.temTelefone,
        emojiCount: analise.emojiCount,
        capsRatio: analise.capsRatio
      };

      setMessageResult(result);
      saveToHistory(result, "message", message);
    } catch (error) {
      alert("Erro ao analisar mensagem.");
    } finally {
      setMessageLoading(false);
    }
  };



  const analyzePDF = (file: File) => {
    if (!file) {
      alert("Por favor, selecione um arquivo PDF!");
      return;
    }

    const result = {
      filename: file.name,
      filesize: file.size,
      risks: [] as any[],
      isScam: false,
      score: 0
    };

    // Verificar tamanho do arquivo
    if (file.size > 50 * 1024 * 1024) {
      result.risks.push({
        name: "Arquivo Muito Grande",
        risk: "high",
        reason: "Arquivos PDF maliciosos costumam ser maiores que o normal"
      });
      result.score += 30;
    }

    // Verificar tipo MIME
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      result.risks.push({
        name: "Tipo de Arquivo Suspeito",
        risk: "high",
        reason: "Este arquivo pode não ser um PDF legítimo"
      });
      result.score += 40;
    }

    // Verificar nome do arquivo
    const filename = file.name.toLowerCase();
    const suspiciousPatterns = [
      /invoice|fatura|boleto|pagamento/i,
      /update|atualizar|download/i,
      /confirm|confirme|verificar/i,
      /urgente|urgent|importante/i,
      /click|clique|abra/i
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(filename)) {
        result.risks.push({
          name: "Nome de Arquivo Suspeito",
          risk: "medium",
          reason: `O nome contém palavras comuns em PDFs maliciosos: "${filename}"`
        });
        result.score += 20;
      }
    });

    // Padrão de nomes de golpe
    if (/\d{3,}|[A-Z]{5,}|_+/.test(filename)) {
      result.risks.push({
        name: "Padrão de Nome Aleatório",
        risk: "medium",
        reason: "Nomes aleatórios são comuns em arquivos maliciosos"
      });
      result.score += 15;
    }

    // Verificar se é um PDF vazio ou muito pequeno
    if (file.size < 1024) {
      result.risks.push({
        name: "Arquivo Muito Pequeno",
        risk: "medium",
        reason: "Pode ser um executável disfarçado de PDF"
      });
      result.score += 20;
    }

    result.isScam = result.score >= 35;
    setPdfResult(result);
  };

  const handleQRCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('qrCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Usar jsQR para decodificacao real de QR Code
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            // QR Code decodificado com sucesso
            const decodedUrl = code.data;
            
            // Validar se eh uma URL
            try {
              new URL(decodedUrl);
              // Eh uma URL valida, analisar
              const analysis = analyzeLink(decodedUrl);
              if (analysis) {
                setQrResult({
                  ...analysis,
                  url: decodedUrl,
                  isScam: analysis.score >= 40,
                  decoded: true
                });
              }
            } catch {
              // Nao eh uma URL, mostrar o conteudo decodificado
              setQrResult({
                url: decodedUrl,
                isScam: false,
                decoded: true,
                message: `Conteudo decodificado: ${decodedUrl}`
              });
            }
          } else {
            alert("Nenhum QR Code detectado na imagem. Tente outra imagem.");
          }
        } catch (error) {
          console.error("Erro ao processar QR Code:", error);
          alert("Erro ao processar a imagem. Tente novamente.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzePDF(file);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Threat Intelligence Hero Section */}
      <ThreatIntelligenceHero />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 mt-4">

        


        {/* PIX EMERGENCY TAB */}
        {activeTab === "pix" && (
          <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {/* Conteúdo da sub-aba 1: Estão me pedindo Pix */}
            {pixSubTab === "pedindo" && (
            <>
            <Alert className="bg-red-50 border-4 border-red-600 p-3 sm:p-4">
              <AlertTriangle className="h-6 sm:h-8 w-6 sm:w-8 text-red-600 flex-shrink-0" />
              <AlertTitle className="text-2xl sm:text-3xl text-red-700 font-bold mt-2 sm:mt-0">🚨 PARE AGORA!</AlertTitle>
              <AlertDescription className="text-base sm:text-xl text-red-800 mt-2 sm:mt-4 space-y-2 sm:space-y-4 leading-relaxed">
                <p className="font-bold text-sm sm:text-base">Se alguém está pedindo Pix, PARE e faça isso:</p>
              </AlertDescription>
            </Alert>

            <Card className="border-4 border-red-500 shadow-lg min-h-auto flex flex-col">
              <CardHeader className="bg-red-100 pb-3">
                <CardTitle className="text-xl sm:text-2xl">O que fazer AGORA</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-red-600 flex flex-col">
                    <p className="font-bold text-red-700 mb-2 text-sm sm:text-base">1️⃣ PAUSE</p>
                    <p className="text-xs sm:text-sm text-gray-700">Não faça Pix ainda. Não é emergência real.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-orange-600 flex flex-col">
                    <p className="font-bold text-orange-700 mb-2 text-sm sm:text-base">2️⃣ LIGUE</p>
                    <p className="text-xs sm:text-sm text-gray-700">Ligue para a pessoa por chamada normal ou vídeo chamada. Se ela não atender, é golpe.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-yellow-600 flex flex-col">
                    <p className="font-bold text-yellow-700 mb-2 text-sm sm:text-base">3️⃣ CONFIRME</p>
                    <p className="text-xs sm:text-sm text-gray-700">Confirme a história dela. Pergunte detalhes que só ela sabe.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-green-600 flex flex-col">
                    <p className="font-bold text-green-700 mb-2 text-sm sm:text-base">4️⃣ AVISE</p>
                    <p className="text-xs sm:text-sm text-gray-700">Se for golpe, avise a pessoa que sua conta foi sequestrada.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-green-50 border-2 border-green-600 rounded-lg" style={{ maxWidth: '900px', margin: '24px auto', padding: '24px' }}>
              <div className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl text-green-700 font-bold mb-3">✅ Lembre-se</h3>
                  <p className="text-sm sm:text-lg text-green-800 leading-relaxed">
                    <strong>Pessoas de verdade sempre podem ser confirmadas por ligação.</strong> Se não conseguir ligar, não é emergência real.
                  </p>
                </div>
              </div>
            </div>
            </>
            )}

            {/* Conteúdo da sub-aba 2: Cai no golpe */}
            {pixSubTab === "golpe" && (
            <>
            <Card className="border-4 border-red-500 shadow-lg bg-red-50 min-h-auto flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl text-red-700">🚨 Você caiu no golpe?</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-red-600 flex flex-col">
                    <p className="font-bold text-red-700 mb-2 text-sm sm:text-base">1️⃣ PARE</p>
                    <p className="text-xs sm:text-sm text-gray-700">Se ainda não enviou, não envie mais. Se já enviou, anote o valor e a hora.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-orange-600 flex flex-col">
                    <p className="font-bold text-orange-700 mb-2 text-sm sm:text-base">2️⃣ BANCO</p>
                    <p className="text-xs sm:text-sm text-gray-700">Ligue para o banco e avise sobre a transferência suspeita. Eles podem bloquear.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-yellow-600 flex flex-col">
                    <p className="font-bold text-yellow-700 mb-2 text-sm sm:text-base">3️⃣ BO</p>
                    <p className="text-xs sm:text-sm text-gray-700">Registre um Boletim de Ocorrência na delegacia ou online.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-blue-600 flex flex-col">
                    <p className="font-bold text-blue-700 mb-2 text-sm sm:text-base">4️⃣ AVISE</p>
                    <p className="text-xs sm:text-sm text-gray-700">Se sua conta foi sequestrada, avise todos os seus contatos no WhatsApp.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </>
            )}

            {/* Conteúdo da sub-aba 3: Blindar meu WhatsApp */}
            {pixSubTab === "blindar" && (
            <>
            <Card className="border-4 border-green-500 shadow-lg bg-green-50 min-h-auto flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl text-green-700">🔒 Como blindar seu WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-green-600 flex flex-col">
                    <p className="font-bold text-green-700 mb-2 text-sm sm:text-base">1️⃣ 2FA</p>
                    <p className="text-xs sm:text-sm text-gray-700">Ative verificação em 2 etapas: WhatsApp → Configurações → Conta</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-green-600 flex flex-col">
                    <p className="font-bold text-green-700 mb-2 text-sm sm:text-base">2️⃣ SENHA</p>
                    <p className="text-xs sm:text-sm text-gray-700">Crie uma senha forte com números, letras e símbolos. Mínimo 6 dígitos.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-green-600 flex flex-col">
                    <p className="font-bold text-green-700 mb-2 text-sm sm:text-base">3️⃣ CÓDIGO</p>
                    <p className="text-xs sm:text-sm text-gray-700">Nunca compartilhe o código de 6 dígitos com ninguém.</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-green-600 flex flex-col">
                    <p className="font-bold text-green-700 mb-2 text-sm sm:text-base">4️⃣ LOGOUT</p>
                    <p className="text-xs sm:text-sm text-gray-700">WhatsApp Web → Configurações → Desconecte sessões desconhecidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </>
            )}
          </div>
        )}

        {/* GOLPES COMUNS TAB */}
        {activeTab === "golpes" && (
          <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <Card className="border-2 border-orange-300 dark:border-orange-600">
              <CardHeader className="bg-orange-100 dark:bg-orange-900/30">
                <CardTitle className="text-2xl flex items-center gap-2">
                  ⚠️ Golpes Comuns no Brasil
                </CardTitle>
                <CardDescription className="text-base">
                  Conheça os tipos de golpe mais frequentes e como se proteger
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {[
                    { tipo: "Falso Suporte WhatsApp", descricao: "Golpistas fingem ser suporte do WhatsApp pedindo código de verificação. Nunca compartilhe seu código!" },
                    { tipo: "Falso PIX", descricao: "Mensagens falsas pedindo PIX para 'liberar' algo ou 'confirmar' transação. Bancos nunca pedem PIX por mensagem." },
                    { tipo: "Falsa Encomenda", descricao: "Links falsos de rastreamento que levam a phishing. Sempre acesse o site oficial da transportadora." },
                    { tipo: "Falso Banco", descricao: "Sites que imitam bancos para roubar dados de acesso. Verifique a URL antes de fazer login." },
                    { tipo: "Falso DETRAN", descricao: "Mensagens sobre multas ou documentos do DETRAN com links falsos. Acesse sempre o portal oficial." },
                    { tipo: "Falso gov.br", descricao: "Sites que imitam portais governamentais. Desconfie de URLs com erros de digitação." },
                    { tipo: "Falso Prêmio", descricao: "'Você ganhou um prêmio!' Nunca ganhou? Então é golpe. Não clique em links." },
                    { tipo: "Falso Cupom", descricao: "Links de cupons falsos que instalam malware. Baixe apps apenas da loja oficial." }
                  ].map((golpe, idx) => (
                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg border-l-4 border-red-600">
                      <h4 className="font-bold text-base sm:text-lg text-red-700 dark:text-red-400 mb-2">{golpe.tipo}</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{golpe.descricao}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 sm:mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-lg border-l-4 border-blue-600">
                  <h4 className="font-bold text-base sm:text-lg text-blue-700 dark:text-blue-400 mb-2 sm:mb-3">🛡️ Como se Proteger</h4>
                  <ul className="space-y-1 sm:space-y-2 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                    <li>✓ Nunca clique em links de mensagens não solicitadas</li>
                    <li>✓ Verifique a URL antes de fazer login em qualquer site</li>
                    <li>✓ Desconfie de mensagens urgentes pedindo dados ou dinheiro</li>
                    <li>✓ Ligue para o número oficial da empresa se tiver dúvida</li>
                    <li>✓ Use o Pare Antes do Pix para analisar links suspeitos</li>
                    <li>✓ Ative autenticação de dois fatores em suas contas</li>
                    <li>✓ Mantenha seu WhatsApp e apps atualizados</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Ferramentas de Análise - Nova Navegação */}
      <ToolsNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as typeof activeTab)} />

        {/* SOBRE TAB */}
        {activeTab === "sobre" && (
          <div className={`max-w-3xl mx-auto transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <AboutProject />
          </div>
        )}

        {/* EMAIL ANALYZER TAB */}
        {activeTab === "email" && (
          <TabTransition isActive={activeTab === "email"} duration={300}>
            <div className="max-w-4xl mx-auto">
              <EmailAnalyzerWithCollapse />
            </div>
          </TabTransition>
        )}

        {/* MESSAGE ANALYZER TAB */}
        {activeTab === "message" && (
          <div className={`max-w-4xl mx-auto transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <MessageAnalyzer />
          </div>
        )}

        {/* SCREENSHOT ANALYZER TAB */}
        {activeTab === "screenshot" && (
          <TabTransition isActive={activeTab === "screenshot"} duration={300}>
            <div className="max-w-4xl mx-auto">
              <ScreenshotAnalyzer />
            </div>
          </TabTransition>
        )}

        {/* IOC ANALYZER TAB */}
        {activeTab === "ioc" && (
          <TabTransition isActive={activeTab === "ioc"} duration={300}>
            <div className="max-w-4xl mx-auto">
              <IOCAnalyzer />
            </div>
          </TabTransition>
        )}

        {/* LINK ANALYSIS TAB */}
        {activeTab === "link" && (
          <TabTransition isActive={activeTab === "link"} duration={300}>
            <div className="max-w-4xl mx-auto">
              <LinkAnalyzerNeon
                linkInput={linkInput}
                setLinkInput={setLinkInput}
                linkLoading={linkLoading}
                linkResult={linkResult}
                loadingStep={loadingStep}
                onAnalyze={() => analyzeLink(linkInput)}
              />
            </div>
          </TabTransition>
        )}

        {/* MESSAGE ANALYSIS TAB */}
        {activeTab === "message" && (
          <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <Card className="border-2 border-purple-500 shadow-lg">
              <CardHeader className="bg-purple-100">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Analisar Mensagem Completa
                </CardTitle>
                <CardDescription className="text-lg">
                  Cole a mensagem inteira do WhatsApp para identificar padrões de golpe
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-lg font-semibold mb-2 block flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Cole a Mensagem Aqui (Análise em Tempo Real)
                  </label>
                  <Textarea
                    placeholder="Cole a mensagem de WhatsApp que recebeu..."
                    value={realtimeMessage}
                    onChange={(e) => updateRealtimeMessage(e.target.value)}
                    className="text-lg py-6 min-h-32"
                  />
                </div>
                
                {/* Preview de Análise em Tempo Real */}
                {realtimeMessage.trim() && realtimeAnalysis && (
                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-300">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg text-purple-800 dark:text-purple-200">Análise em Tempo Real</h4>
                      {isRealtimeAnalyzing && <div className="animate-spin"><Zap className="w-5 h-5 text-yellow-500" /></div>}
                    </div>
                    
                    {/* Score Visual */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-900 dark:text-purple-100">Score de Risco:</span>
                        <span className={`text-2xl font-bold ${realtimeAnalysis.corRisco}`}>{realtimeAnalysis.score}%</span>
                      </div>
                      <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all ${realtimeAnalysis.corRisco}`}
                          style={{ width: `${realtimeAnalysis.score}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Nível de Risco */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-purple-900 dark:text-purple-100">Nível:</span>
                      <span className={`px-3 py-1 rounded-full font-bold text-white ${realtimeAnalysis.corRisco}`}>
                        {realtimeAnalysis.nivelRisco}
                      </span>
                    </div>
                    
                    {/* Padrões Detectados */}
                    {realtimeAnalysis.padrõesDetectados && realtimeAnalysis.padrõesDetectados.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-semibold text-purple-900 dark:text-purple-100">Padrões Detectados:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {realtimeAnalysis.padrõesDetectados.slice(0, 4).map((padrao: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-purple-600">
                              <p className="text-sm font-bold text-purple-800 dark:text-purple-300">{padrao.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{padrao.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Resumo */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-purple-600">
                      <p className="text-sm text-purple-900 dark:text-purple-100">{realtimeAnalysis.resumo}</p>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => {
                    setMessageInput(realtimeMessage);
                    analyzeMessage(realtimeMessage);
                  }}
                  disabled={!realtimeMessage.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 font-bold disabled:opacity-50"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Analisar Mensagem Completa
                </Button>
              </CardContent>
            </Card>

            {messageLoading && (
              <Card className="border-2 border-purple-400 bg-purple-50 dark:bg-purple-900/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {[
                      "🔍 Analisando texto...",
                      "🔍 Detectando padrões de golpe...",
                      "🔍 Verificando palavras-chave...",
                      "🔍 Analisando contexto...",
                      "🔍 Calculando risco..."
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded text-lg font-semibold transition-all ${
                          idx <= messageLoadingStep
                            ? "bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {messageResult && (
              <Card className={`border-4 shadow-lg ${messageResult.isScam ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
                <CardHeader>
                  <CardTitle className={`text-2xl flex items-center gap-2 ${messageResult.isScam ? "text-red-700" : "text-green-700"}`}>
                    {messageResult.isScam ? (
                      <>
                        <AlertTriangle className="w-6 h-6" />
                        ⚠️ SINAIS DE RISCO!
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        ✅ SINAIS BAIXOS
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={`text-lg font-bold ${messageResult.isScam ? "text-red-700" : "text-green-700"}`}>
                    Nível de risco: {messageResult.score}%
                  </p>
                  
                  {/* Domain Age Indicator */}
                  {messageResult.extractedLinks && messageResult.extractedLinks.length > 0 && (
                    <DomainAgeIndicator createdDate={messageResult.whoisData?.createdDate} />
                  )}
                  
                  {/* Fontes Consultadas */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                    <ConsultedSourcesPanel sources={useConsultedSources(messageResult as any)} />
                  </div>
                  
                  {messageResult.extractedLinks.length > 0 && (
                    <div>
                      <h4 className="font-bold text-lg mb-3">Links Encontrados:</h4>
                      <div className="space-y-2">
                        {messageResult.extractedLinks.map((link: string, idx: number) => (
                          <div key={idx} className="bg-white p-2 rounded border-l-4 border-blue-500 break-all">
                            <code className="text-sm text-gray-700">{link}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {messageResult.risks.length > 0 && (
                    <div>
                      <h4 className="font-bold text-lg mb-3">Sinais Detectados:</h4>
                      <div className="space-y-3">
                        {messageResult.risks.map((risk: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded border-l-4 border-yellow-500">
                            <p className="font-bold text-gray-800">{risk.name}</p>
                            <p className="text-gray-700">{risk.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => shareToWhatsApp(generateShareMessage("link", messageResult))}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg mt-4"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Compartilhar no WhatsApp
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* QR CODE TAB */}
        {activeTab === "qrcode" && (
          <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <Card className="border-2 border-orange-500 shadow-lg">
              <CardHeader className="bg-orange-100">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <QrCode className="w-6 h-6" />
                  Verificar QR Code
                </CardTitle>
                <CardDescription className="text-lg">
                  Faça upload de uma imagem de QR Code para decodificar e verificar o link
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-lg font-semibold mb-2 block">Selecione uma imagem com QR Code</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleQRCodeUpload}
                    className="text-lg py-6"
                  />
                </div>
                <canvas id="qrCanvas" style={{ display: 'none' }}></canvas>
              </CardContent>
            </Card>

            {qrResult && (
              <Card className={`border-4 shadow-lg ${qrResult.isScam ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
                <CardHeader>
                  <CardTitle className={`text-2xl flex items-center gap-2 ${qrResult.isScam ? "text-red-700" : "text-green-700"}`}>
                    {qrResult.isScam ? (
                      <>
                        <AlertTriangle className="w-6 h-6" />
                        ⚠️ QR CODE COM RISCO!
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        ✅ QR CODE SEGURO
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded border-2 border-gray-300">
                    <p className="text-sm text-gray-600">Link decodificado:</p>
                    <p className="text-sm font-mono text-gray-800 break-all">{qrResult.url}</p>
                  </div>
                  <p className={`text-lg font-bold ${qrResult.isScam ? "text-red-700" : "text-green-700"}`}>
                    Nível de risco: {qrResult.score}%
                  </p>
                  {qrResult.risks.length > 0 && (
                    <div>
                      <h4 className="font-bold text-lg mb-3">Sinais Detectados:</h4>
                      <div className="space-y-3">
                        {qrResult.risks.map((risk: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded border-l-4 border-yellow-500">
                            <p className="font-bold text-gray-800">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {qrResult.url && (
                    <Button
                      onClick={() => shareToWhatsApp(generateShareMessage("link", { url: qrResult.url, score: qrResult.score }))}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg mt-4"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Compartilhar no WhatsApp
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* PDF TAB */}
        {activeTab === "pdf" && (
          <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <Card className="border-2 border-red-500 shadow-lg">
              <CardHeader className="bg-red-100">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Analisar Segurança de PDF
                </CardTitle>
                <CardDescription className="text-lg">
                  Faça upload de um PDF para verificar se contém padrões de malware
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-lg font-semibold mb-2 block">Selecione um PDF</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFUpload}
                    className="text-lg py-6"
                  />
                </div>
              </CardContent>
            </Card>

            {pdfResult && (
              <Card className={`border-4 shadow-lg ${pdfResult.isScam ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
                <CardHeader>
                  <CardTitle className={`text-2xl flex items-center gap-2 ${pdfResult.isScam ? "text-red-700" : "text-green-700"}`}>
                    {pdfResult.isScam ? (
                      <>
                        <AlertTriangle className="w-6 h-6" />
                        ⚠️ SINAIS DE RISCO!
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        ✅ SINAIS BAIXOS
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded border-2 border-gray-300">
                    <p className="text-sm text-gray-600">Arquivo:</p>
                    <p className="text-lg font-mono text-gray-800">{pdfResult.filename}</p>
                    <p className="text-sm text-gray-600 mt-2">Tamanho: {(pdfResult.filesize / 1024).toFixed(2)} KB</p>
                  </div>
                  <p className={`text-lg font-bold ${pdfResult.isScam ? "text-red-700" : "text-green-700"}`}>
                    Nível de risco: {pdfResult.score}%
                  </p>
                  {pdfResult.risks.length > 0 && (
                    <div>
                      <h4 className="font-bold text-lg mb-3">Sinais Detectados:</h4>
                      <div className="space-y-3">
                        {pdfResult.risks.map((risk: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded border-l-4 border-yellow-500">
                            <p className="font-bold text-gray-800">{risk.name}</p>
                            <p className="text-gray-700">{risk.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* EMERGENCY TAB */}
        {activeTab === "emergencia" && (
          <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <Alert className="bg-red-50 border-4 border-red-600">
              <AlertOctagon className="h-8 w-8 text-red-600" />
              <AlertTitle className="text-3xl text-red-700 font-bold">🆘 CAIU NO GOLPE?</AlertTitle>
              <AlertDescription className="text-xl text-red-800 mt-4 leading-relaxed">
                Siga estes passos AGORA para minimizar os danos
              </AlertDescription>
            </Alert>

            <Card className="border-4 border-red-500 shadow-lg">
              <CardHeader className="bg-red-100">
                <CardTitle className="text-2xl">Passos de Emergência</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-lg space-y-4">
                <div className="bg-white p-4 rounded border-l-4 border-red-600">
                  <p className="font-bold text-red-700 mb-2">1️⃣ AVISE FAMILIARES</p>
                  <p>Ligue para familiares e avise que sua conta foi sequestrada. Peça para não enviar dinheiro.</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-orange-600">
                  <p className="font-bold text-orange-700 mb-2">2️⃣ BLOQUEIE O CONTATO</p>
                  <p>Bloqueie o número que está usando sua conta no WhatsApp.</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-yellow-600">
                  <p className="font-bold text-yellow-700 mb-2">3️⃣ DENUNCIE NO WHATSAPP</p>
                  <p>Toque em ... → Mais → Denunciar o contato/número.</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-green-600">
                  <p className="font-bold text-green-700 mb-2">4️⃣ REGISTRE BO ONLINE</p>
                  <p>Acesse www.delegaciaeletronica.policiafederal.gov.br e registre boletim de ocorrência.</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-blue-600">
                  <p className="font-bold text-blue-700 mb-2">5️⃣ FALE COM SEU BANCO</p>
                  <p>Se enviou dinheiro por Pix, ligue IMEDIATAMENTE para seu banco pelos canais oficiais.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-600 shadow-lg bg-red-50">
              <CardHeader>
                <CardTitle className="text-2xl text-red-700">Se Enviou Dinheiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-lg">
                <p className="font-bold text-red-800">Ligue para seu banco AGORA pelos canais oficiais:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Não use números de telefone da mensagem</li>
                  <li>• Use o número no verso do seu cartão</li>
                  <li>• Diga que foi vítima de Pix fraudulento</li>
                  <li>• Forneça data, hora, valor e chave Pix usada</li>
                  <li>• Peça para bloquear a chave Pix imediatamente</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-600 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-700">Números Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-lg">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-bold text-blue-900">🚔 Polícia Federal (Crimes Cibernéticos)</p>
                  <p className="text-xl text-blue-800 font-mono">0800 761 6060</p>
                </div>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-bold text-blue-900">📋 Delegacia Eletrônica</p>
                  <p className="text-blue-800">www.delegaciaeletronica.policiafederal.gov.br</p>
                </div>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-bold text-blue-900">🏦 Seu Banco</p>
                  <p className="text-blue-800">Número no verso do seu cartão</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* BLINDAR TAB */}
        {activeTab === "blindar" && (
          <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <Alert className="bg-blue-50 border-4 border-blue-600">
              <Lock className="h-8 w-8 text-blue-600" />
              <AlertTitle className="text-3xl text-blue-700 font-bold">🔒 BLINDAR SEU WHATSAPP</AlertTitle>
              <AlertDescription className="text-xl text-blue-800 mt-4 leading-relaxed">
                Siga estes passos para proteger sua conta contra sequestro
              </AlertDescription>
            </Alert>

            <Card className="border-2 border-blue-500 shadow-lg">
              <CardHeader className="bg-blue-100">
                <CardTitle className="text-2xl">Proteção Essencial</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-lg space-y-4">
                <div className="bg-white p-4 rounded border-l-4 border-blue-600">
                  <p className="font-bold text-blue-700 mb-2">✓ Ativar Verificação em Duas Etapas</p>
                  <p className="mb-2">Configurações → Conta → Verificação em duas etapas → Ativar</p>
                  <p className="text-gray-700">Isso cria um PIN secreto que só você conhece.</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-blue-600">
                  <p className="font-bold text-blue-700 mb-2">✓ Criar PIN Secreto</p>
                  <p className="mb-2">Use 6 dígitos que ninguém sabe. Não use datas de nascimento.</p>
                  <p className="text-gray-700">Exemplo: 847392 (aleatório)</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-red-600">
                  <p className="font-bold text-red-700 mb-2">✓ Nunca Compartilhar Código</p>
                  <p className="mb-2">Se receber código de 6 dígitos do WhatsApp, NÃO compartilhe com ninguém.</p>
                  <p className="text-gray-700">Nem com amigos, nem com suporte, nem com "WhatsApp".</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-blue-600">
                  <p className="font-bold text-blue-700 mb-2">✓ Foto de Perfil Privada</p>
                  <p className="mb-2">Configurações → Privacidade → Foto de perfil → Meus contatos</p>
                  <p className="text-gray-700">Assim golpistas não conseguem ver sua foto.</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-blue-600">
                  <p className="font-bold text-blue-700 mb-2">✓ Criar Palavra de Segurança da Família</p>
                  <p className="mb-2">Combine com sua família uma palavra secreta.</p>
                  <p className="text-gray-700">Exemplo: "Sempre confirme por ligação". Se alguém pedir Pix sem falar a palavra, é golpe.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500 shadow-lg bg-green-50">
              <CardHeader>
                <CardTitle className="text-2xl text-green-700">Dicas Extras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-lg">
                <p className="flex items-start gap-2">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Não abra links de pessoas desconhecidas</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Não instale apps de fontes estranhas</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Não compartilhe sua tela com ninguém</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Mantenha seu celular atualizado</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-700 font-bold">✓</span>
                  <span>Desconfie de pedidos urgentes de dinheiro</span>
                </p>
              </CardContent>
            </Card>
          </div>
        )}



        {/* COMO FUNCIONA TAB */}
        {activeTab === "como-funciona" && (
          <div className={`max-w-4xl mx-auto space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <Card className="border-2 border-blue-600 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardHeader className="bg-blue-100 dark:bg-blue-900/40">
                <CardTitle className="text-3xl text-blue-800 dark:text-blue-300">ℹ️ Como Funciona</CardTitle>
                <CardDescription className="text-lg text-blue-700 dark:text-blue-400 mt-2">Entenda como o Shield Security Scanner protege você</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-l-4 border-blue-600">
                  <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">🔍 Análise em 5 Etapas</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">1</div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">Validação de URL</h4>
                        <p className="text-gray-700 dark:text-gray-300">Verificamos se a URL está bem formatada e é acessível</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">2</div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">Detecção de Padrões</h4>
                        <p className="text-gray-700 dark:text-gray-300">Analisamos 10+ padrões comuns de phishing e golpes</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">3</div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">Análise de Reputação</h4>
                        <p className="text-gray-700 dark:text-gray-300">Verificamos se o domínio é conhecido e confiável</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">4</div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">Cálculo de Score</h4>
                        <p className="text-gray-700 dark:text-gray-300">Geramos um score de risco de 0 a 100</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">5</div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">Explicação Humana</h4>
                        <p className="text-gray-700 dark:text-gray-300">Explicamos em linguagem clara por que o link é suspeito</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-l-4 border-green-600">
                  <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-4">✅ O que Analisamos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">Estrutura da URL</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">Typosquatting (imitação de marca)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">URLs encurtadas</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">Domínios suspeitos (.xyz, .top, etc)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">Muitos hífens na URL</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">Certificado HTTPS</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">Padrões de phishing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold text-xl">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">Hosts internos/locais</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-l-4 border-purple-600">
                  <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">🛡️ Privacidade</h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>✓ <strong>Análise 100% local</strong> - Tudo acontece no seu dispositivo</p>
                    <p>✓ <strong>Sem coleta de dados</strong> - Não salvamos URLs, mensagens ou dados pessoais</p>
                    <p>✓ <strong>Sem rastreamento</strong> - Não usamos cookies ou analytics invasivos</p>
                    <p>✓ <strong>Código aberto</strong> - Você pode verificar como funciona</p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border-l-4 border-yellow-600">
                  <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-4">⚠️ Limitações</h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>• <strong>Não é 100% seguro</strong> - Phishing evolui constantemente</p>
                    <p>• <strong>Falsos positivos podem ocorrer</strong> - Nem todo link suspeito é golpe</p>
                    <p>• <strong>Falsos negativos podem ocorrer</strong> - Alguns golpes podem não ser detectados</p>
                    <p>• <strong>Sempre verifique por telefone</strong> - Ligue para o número oficial da empresa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>

{/* Footer Profissional */}
      <footer className="footer mt-20 pt-12 border-t border-gray-700/30 opacity-60 hover:opacity-100 transition-opacity duration-300">
        <div className="footer-content text-center">
          <div className="text-sm text-gray-400 space-y-2">
            <p>🛡️ <span className="text-cyan-300 font-semibold">Thiago Buente</span></p>
            <p className="text-xs text-gray-500">Cibersegurança • IA • Vibe Coding</p>
            <p className="text-xs text-cyan-400 font-semibold">Fundador do Shield Security Scanner • Membro da CYBERDIMENSION</p>
            <div className="pt-2">
              <a href="https://www.linkedin.com/in/thiago-barros-buente-teixeira" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/8 hover:bg-cyan-500/15 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 text-cyan-300 hover:text-cyan-200 font-semibold text-xs">
                <span>🔗</span>
                <span>LinkedIn • @thiagobuente</span>
              </a>
            </div>
            <p className="text-xs text-gray-600 pt-2">© 2026 Shield Security Scanner</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
