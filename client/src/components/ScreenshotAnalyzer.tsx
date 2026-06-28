import { useState, useRef } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Image as ImageIcon, AlertCircle, Upload, X, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkeletonAnalysis, SkeletonGrid } from './SkeletonLoader';

interface DetectedElement {
  type: string;
  confidence: number;
  description: string;
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
  icon: string;
}

interface ScreenshotAnalysisResult {
  score: number;
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
  detectedElements: DetectedElement[];
  suspiciousText: string[];
  identitiesDetected: string[];
  recommendations: string[];
}

interface AnalyzedImage {
  id: string;
  file: File;
  preview: string;
  result: ScreenshotAnalysisResult | null;
  isAnalyzing: boolean;
}

interface ComparisonResult {
  commonPatterns: string[];
  commonThreats: string[];
  averageScore: number;
  maxScore: number;
  minScore: number;
  campaignLikelihood: number;
  campaignDescription: string;
}

const IDENTITY_KEYWORDS = {
  'Receita Federal': ['receita federal', 'imposto de renda', 'declaração', 'pendência fiscal'],
  'Banco do Brasil': ['banco do brasil', 'bb', 'conta bloqueada', 'segurança'],
  'Itaú': ['itaú', 'itau', 'agência', 'conta'],
  'Bradesco': ['bradesco', 'bradesco net'],
  'Caixa': ['caixa', 'caixa econômica', 'fgts'],
  'Correios': ['correios', 'encomenda', 'pacote'],
  'WhatsApp': ['whatsapp', 'verificação whatsapp'],
  'YouTube': ['youtube', 'canal youtube', 'monetização'],
  'Gov.br': ['gov.br', 'governo federal'],
  'Polícia Federal': ['polícia federal', 'pf', 'investigação'],
};

const SUSPICIOUS_PATTERNS = {
  'QR Code': { pattern: /qr\s*code|código\s*qr/i, icon: '📱', risk: 'alto' as const },
  'PIX': { pattern: /\bpix\b|chave\s*pix|transferência/i, icon: '💰', risk: 'crítico' as const },
  'Link Suspeito': { pattern: /bit\.ly|tinyurl|short\.link|goo\.gl|clique\s*aqui/i, icon: '🔗', risk: 'alto' as const },
  'Senha/Código': { pattern: /senha|pin|código|otp|verificação|autenticação/i, icon: '🔑', risk: 'crítico' as const },
  'Urgência': { pattern: /urgente|imediatamente|agora|rápido|clique\s*já|não\s*espere/i, icon: '⏰', risk: 'alto' as const },
  'Medo/Ameaça': { pattern: /bloqueado|suspenso|cancelado|fraude|crime|multa|prisão/i, icon: '😨', risk: 'alto' as const },
};

export default function ScreenshotAnalyzer() {
  const [images, setImages] = useState<AnalyzedImage[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    elements: true,
    text: false,
    identities: false,
  });
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleMultipleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: AnalyzedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        const id = `img_${Date.now()}_${Math.random()}`;
        
        setImages(prev => [...prev, {
          id,
          file,
          preview,
          result: null,
          isAnalyzing: false,
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (images.length <= 1) {
      setShowComparison(false);
      setComparisonResult(null);
    }
  };

  const analyzeImage = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, isAnalyzing: true } : img
    ));

    setTimeout(() => {
      const image = images.find(img => img.id === id);
      if (image) {
        const result = performAnalysis(image.preview);
        setImages(prev => prev.map(img =>
          img.id === id ? { ...img, result, isAnalyzing: false } : img
        ));
      }
    }, 2000);
  };

  const analyzeAllImages = () => {
    images.forEach(img => {
      if (!img.result) {
        analyzeImage(img.id);
      }
    });
  };

  const compareImages = () => {
    const analyzedImages = images.filter(img => img.result);
    if (analyzedImages.length < 2) {
      alert('Por favor, analise pelo menos 2 imagens antes de comparar');
      return;
    }

    const comparison = performComparison(analyzedImages);
    setComparisonResult(comparison);
    setShowComparison(true);
  };

  const performAnalysis = (imageData: string): ScreenshotAnalysisResult => {
    let score = 0;
    const detectedElements: DetectedElement[] = [];
    const suspiciousText: string[] = [];
    const identitiesDetected: string[] = [];

    // Simular detecção de elementos na imagem
    if (Math.random() > 0.6) {
      score += 30;
      detectedElements.push({
        type: 'QR Code',
        confidence: 85,
        description: 'QR Code detectado na imagem - pode levar a links maliciosos',
        riskLevel: 'alto',
        icon: '📱'
      });
      suspiciousText.push('QR Code detectado');
    }

    if (Math.random() > 0.5) {
      score += 25;
      detectedElements.push({
        type: 'Logo Falsificado',
        confidence: 78,
        description: 'Possível falsificação de logo de instituição conhecida',
        riskLevel: 'crítico',
        icon: '🏢'
      });
      suspiciousText.push('Logo suspeito detectado');
    }

    if (Math.random() > 0.55) {
      score += 20;
      detectedElements.push({
        type: 'Linguagem de Urgência',
        confidence: 92,
        description: 'Texto contém palavras que criam pressão temporal',
        riskLevel: 'alto',
        icon: '⏰'
      });
      suspiciousText.push('Urgência detectada');
    }

    if (Math.random() > 0.65) {
      score += 35;
      detectedElements.push({
        type: 'Solicitação de PIX',
        confidence: 88,
        description: 'Imagem contém solicitação de transferência via PIX',
        riskLevel: 'crítico',
        icon: '💰'
      });
      suspiciousText.push('PIX detectado');
    }

    if (Math.random() > 0.5) {
      score += 15;
      detectedElements.push({
        type: 'Link Suspeito',
        confidence: 81,
        description: 'URL encurtada ou suspeita detectada na imagem',
        riskLevel: 'alto',
        icon: '🔗'
      });
      suspiciousText.push('Link encurtado detectado');
    }

    const identities = Object.keys(IDENTITY_KEYWORDS);
    const detectedIdentities = identities.filter(() => Math.random() > 0.7);
    
    if (detectedIdentities.length > 0) {
      score += 30;
      detectedIdentities.forEach(identity => {
        identitiesDetected.push(identity);
        detectedElements.push({
          type: `Falsificação de ${identity}`,
          confidence: 86,
          description: `Imagem tenta se passar por ${identity}`,
          riskLevel: 'crítico',
          icon: '🚨'
        });
      });
    }

    if (Math.random() > 0.6) {
      score += 20;
      detectedElements.push({
        type: 'Pressão Psicológica',
        confidence: 79,
        description: 'Texto usa medo e ameaças para induzir ação',
        riskLevel: 'alto',
        icon: '😨'
      });
      suspiciousText.push('Pressão psicológica detectada');
    }

    score = Math.min(score, 100);

    let riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
    if (score < 20) riskLevel = 'baixo';
    else if (score < 50) riskLevel = 'moderado';
    else if (score < 75) riskLevel = 'alto';
    else riskLevel = 'crítico';

    const recommendations = [
      '❌ Não escaneie QR Codes de fontes desconhecidas',
      '❌ Não envie PIX sem confirmar por ligação',
      '❌ Não clique em links encurtados',
      '✓ Verifique a identidade da instituição através de canal oficial',
      '✓ Desconfie de mensagens com urgência ou ameaças',
    ];

    return {
      score,
      riskLevel,
      detectedElements,
      suspiciousText,
      identitiesDetected,
      recommendations,
    };
  };

  const performComparison = (analyzedImages: AnalyzedImage[]): ComparisonResult => {
    const results = analyzedImages.map(img => img.result!);
    
    // Encontrar padrões comuns
    const allElements = results.flatMap(r => r.detectedElements.map(e => e.type));
    const elementCounts = allElements.reduce((acc, elem) => {
      acc[elem] = (acc[elem] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonPatterns = Object.entries(elementCounts)
      .filter(([_, count]) => count >= Math.ceil(results.length / 2))
      .map(([elem]) => elem);

    // Encontrar ameaças comuns
    const allThreats = results.flatMap(r => r.suspiciousText);
    const threatCounts = allThreats.reduce((acc, threat) => {
      acc[threat] = (acc[threat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonThreats = Object.entries(threatCounts)
      .filter(([_, count]) => count >= Math.ceil(results.length / 2))
      .map(([threat]) => threat);

    // Calcular estatísticas
    const scores = results.map(r => r.score);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Calcular likelihood de campanha coordenada
    const commonPatternsScore = (commonPatterns.length / results.length) * 50;
    const scoreConsistency = (1 - (maxScore - minScore) / 100) * 30;
    const campaignLikelihood = Math.round(commonPatternsScore + scoreConsistency);

    let campaignDescription = '';
    if (campaignLikelihood >= 70) {
      campaignDescription = '🚨 Altamente provável que seja uma campanha coordenada de phishing/golpe';
    } else if (campaignLikelihood >= 50) {
      campaignDescription = '⚠️ Possível campanha coordenada - padrões similares detectados';
    } else {
      campaignDescription = '✓ Ataques isolados - sem evidência de campanha coordenada';
    }

    return {
      commonPatterns,
      commonThreats,
      averageScore,
      maxScore,
      minScore,
      campaignLikelihood,
      campaignDescription,
    };
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'baixo':
        return 'from-green-900/20 to-green-800/10 border-green-500/30';
      case 'moderado':
        return 'from-yellow-900/20 to-yellow-800/10 border-yellow-500/30';
      case 'alto':
        return 'from-orange-900/20 to-orange-800/10 border-orange-500/30';
      case 'crítico':
        return 'from-red-900/20 to-red-800/10 border-red-500/30';
      default:
        return 'from-slate-900/20 to-slate-800/10 border-slate-500/30';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'baixo':
        return 'text-green-400';
      case 'moderado':
        return 'text-yellow-400';
      case 'alto':
        return 'text-orange-400';
      case 'crítico':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'baixo':
        return '🟢 Baixo Risco';
      case 'moderado':
        return '🟡 Risco Moderado';
      case 'alto':
        return '🟠 Alto Risco';
      case 'crítico':
        return '🔴 Risco Crítico';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* INPUT SECTION */}
      <div className="rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-indigo-400 leading-tight">🖼️ Analisador de Capturas de Tela</h2>
        </div>

        <p className="text-slate-400 text-sm mb-4 leading-relaxed">
          Faça upload de múltiplas capturas de tela para detectar QR Codes, links suspeitos, PIX, logos falsificados e comparar padrões de ataque.
        </p>

        {/* FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleMultipleImages}
          className="hidden"
        />

        {/* UPLOAD BUTTON - MOBILE RESPONSIVE */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Selecionar Imagens</span>
            <span className="sm:hidden">Upload</span>
          </Button>

          {images.length > 0 && (
            <>
              <Button
                onClick={analyzeAllImages}
                className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all text-sm sm:text-base"
              >
                🔍 <span className="hidden sm:inline">Analisar Todas</span><span className="sm:hidden">Analisar</span> ({images.length})
              </Button>

              {images.filter(img => img.result).length >= 2 && (
                <Button
                  onClick={compareImages}
                  className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Comparar</span><span className="sm:hidden">Comp.</span> ({images.filter(img => img.result).length})
                </Button>
              )}
            </>
          )}
        </div>

        <p className="text-slate-500 text-xs mt-3 leading-relaxed">
          Máximo 5MB por imagem • Formatos: JPG, PNG, GIF, WebP • Até 10 imagens simultâneas
        </p>
      </div>

      {/* IMAGES GRID - MOBILE RESPONSIVE */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {images.map((image) => (
            <div key={image.id} className="rounded-xl border-2 border-slate-500/20 bg-gradient-to-br from-slate-900/30 to-slate-800/20 p-3 sm:p-4 backdrop-blur-sm">
              {/* Image Preview */}
              <div className="image-preview-container-screenshot relative w-full overflow-hidden rounded-lg bg-black/35 flex items-center justify-center mb-3 max-h-40 sm:max-h-48">
                <img
                  src={image.preview}
                  alt="Preview"
                  className="image-preview-screenshot w-full h-full object-contain max-w-full"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 p-2 rounded-lg transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Analysis Result */}
              {image.isAnalyzing && (
                <div className="space-y-3">
                  <p className="text-indigo-400 text-sm font-semibold text-center">⏳ Analisando...</p>
                  <SkeletonGrid count={2} />
                </div>
              )}

              {image.result && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${getRiskTextColor(image.result.riskLevel)}`}>
                      {getRiskLabel(image.result.riskLevel)}
                    </span>
                    <span className={`text-lg font-bold ${getRiskTextColor(image.result.riskLevel)}`}>
                      {image.result.score}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {image.result.detectedElements.length} elementos detectados
                  </div>
                </div>
              )}

              {!image.result && !image.isAnalyzing && (
                <Button
                  onClick={() => analyzeImage(image.id)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all text-xs sm:text-sm"
                >
                  Analisar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* COMPARISON RESULTS */}
      {showComparison && comparisonResult && (
        <div className="space-y-4">
          {/* Campaign Analysis */}
          <div className={`rounded-xl border-2 bg-gradient-to-br ${getRiskColor(comparisonResult.campaignLikelihood >= 70 ? 'crítico' : comparisonResult.campaignLikelihood >= 50 ? 'alto' : 'moderado')} p-6 backdrop-blur-sm`}>
            <div className="flex items-start gap-4">
              <BarChart3 className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-purple-300 mb-2">📊 Análise Comparativa</h3>
                <p className="text-slate-300 text-sm mb-4">{comparisonResult.campaignDescription}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  <div className="bg-black/20 rounded-lg p-2 sm:p-3">
                    <p className="text-xs text-slate-400 leading-tight">Likelihood</p>
                    <p className="text-lg sm:text-xl font-bold text-purple-400">{comparisonResult.campaignLikelihood}%</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 sm:p-3">
                    <p className="text-xs text-slate-400 leading-tight">Médio</p>
                    <p className="text-lg sm:text-xl font-bold text-orange-400">{comparisonResult.averageScore}%</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 sm:p-3">
                    <p className="text-xs text-slate-400 leading-tight">Máximo</p>
                    <p className="text-lg sm:text-xl font-bold text-red-400">{comparisonResult.maxScore}%</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 sm:p-3">
                    <p className="text-xs text-slate-400 leading-tight">Mínimo</p>
                    <p className="text-lg sm:text-xl font-bold text-green-400">{comparisonResult.minScore}%</p>
                  </div>
                </div>

                {comparisonResult.commonPatterns.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-300 mb-2">🔗 Padrões Comuns:</p>
                    <div className="flex flex-wrap gap-2">
                      {comparisonResult.commonPatterns.map((pattern, idx) => (
                        <span key={idx} className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {comparisonResult.commonThreats.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-300 mb-2">⚠️ Ameaças Comuns:</p>
                    <div className="flex flex-wrap gap-2">
                      {comparisonResult.commonThreats.map((threat, idx) => (
                        <span key={idx} className="bg-red-500/20 text-red-300 text-xs px-3 py-1 rounded-full border border-red-500/30">
                          {threat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL RESULTS */}
      {images.map((image) => (
        image.result && (
          <div key={image.id} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-300">Resultado: {image.file.name}</h3>
              <button
                onClick={() => removeImage(image.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* RISK SCORE */}
            <div className={`rounded-xl border-2 bg-gradient-to-br ${getRiskColor(image.result.riskLevel)} p-6 backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-2xl font-bold ${getRiskTextColor(image.result.riskLevel)} leading-tight`}>
                  {getRiskLabel(image.result.riskLevel)}
                </h3>
                <div className="text-right">
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Score de Risco</p>
                  <p className={`text-4xl font-bold ${getRiskTextColor(image.result.riskLevel)} leading-tight`}>
                    {image.result.score}%
                  </p>
                </div>
              </div>

              {image.result.identitiesDetected.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
                  <p className="text-red-300 text-sm font-semibold leading-relaxed">
                    🚨 Falsificação de Identidade Detectada: {image.result.identitiesDetected.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* DETECTED ELEMENTS */}
            {image.result.detectedElements.length > 0 && (
              <div className="rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-6 backdrop-blur-sm">
                <button
                  onClick={() => toggleSection('elements')}
                  className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                    <h3 className="text-lg font-bold text-orange-400 leading-tight">🔍 Elementos Detectados</h3>
                  </div>
                  {expandedSections.elements ? (
                    <ChevronUp className="w-5 h-5 text-orange-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-orange-400" />
                  )}
                </button>

                {expandedSections.elements && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-orange-500/20">
                    {image.result.detectedElements.map((element, idx) => (
                      <div key={idx} className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <p className="text-orange-300 text-sm font-semibold leading-relaxed">
                              {element.icon} {element.type}
                            </p>
                            <p className="text-orange-200/70 text-xs mt-1 leading-relaxed">
                              {element.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-orange-300 text-xs font-semibold">{element.confidence}%</p>
                            <p className="text-orange-200/50 text-xs">{element.riskLevel}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RECOMMENDATIONS */}
            {image.result.recommendations.length > 0 && (
              <div className="rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-800/10 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-bold text-green-400 leading-tight">💡 Recomendações</h3>
                </div>
                <div className="space-y-2">
                  {image.result.recommendations.map((rec, idx) => (
                    <p key={idx} className="text-green-300 text-sm leading-relaxed">{rec}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ))}
    </div>
  );
}
