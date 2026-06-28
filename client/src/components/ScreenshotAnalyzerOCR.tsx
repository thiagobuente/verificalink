/**
 * Screenshot Analyzer with OCR & Advanced Indicators
 * Análise avançada de capturas de tela com extração de texto, URLs, e-mails, telefones, PIX, etc.
 */

import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  X,
  Trash2,
  BarChart3,
  Loader,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MITREAttackDisplay from '@/components/MITREAttackDisplay';
import { ScreenshotURLhausAnalysis } from '@/components/ScreenshotURLhausAnalysis';
import { trpc } from '@/lib/trpc';

interface ExtractedIndicators {
  text: string;
  urls: string[];
  domains: string[];
  emails: string[];
  phones: string[];
  pixKeys: string[];
  riskPhrases: string[];
  brandNames: string[];
  urgencyIndicators: string[];
  socialEngineeringTerms: string[];
}

interface ScreenshotOCRResult {
  extractedText: string;
  indicators: ExtractedIndicators;
  riskScore: number;
  riskLevel: 'baixo' | 'médio' | 'alto' | 'crítico';
  detectedBrands: string[];
  recommendation: string;
  hasQRCode: boolean;
}

interface AnalyzedImage {
  id: string;
  file: File;
  preview: string;
  result: ScreenshotOCRResult | null;
  isAnalyzing: boolean;
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'crítico':
      return 'bg-red-900/20 border-red-500 text-red-300';
    case 'alto':
      return 'bg-orange-900/20 border-orange-500 text-orange-300';
    case 'médio':
      return 'bg-yellow-900/20 border-yellow-500 text-yellow-300';
    case 'baixo':
      return 'bg-green-900/20 border-green-500 text-green-300';
    default:
      return 'bg-gray-900/20 border-gray-500 text-gray-300';
  }
};

const getRiskBadgeColor = (level: string) => {
  switch (level) {
    case 'crítico':
      return 'bg-red-600 text-white';
    case 'alto':
      return 'bg-orange-600 text-white';
    case 'médio':
      return 'bg-yellow-600 text-white';
    case 'baixo':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

export default function ScreenshotAnalyzerOCR() {
  const [images, setImages] = useState<AnalyzedImage[]>([]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showExtractedText, setShowExtractedText] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // URLhaus query para análise de URLs em screenshot
  const screenshotURLsQuery = trpc.screenshotURLs.analyzeURLs.useQuery(
    { ocrText: ocrText || '' },
    { enabled: !!ocrText }
  );

  const handleMultipleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: AnalyzedImage[] = [];

    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        const id = `img_${Date.now()}_${Math.random()}`;

        setImages((prev) => [
          ...prev,
          {
            id,
            file,
            preview,
            result: null,
            isAnalyzing: false,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const analyzeImage = async (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, isAnalyzing: true } : img))
    );

    try {
      const image = images.find((img) => img.id === id);
      if (!image) return;

      // Simular chamada ao backend
      // Em produção, isso seria: await trpc.screenshot.analyzeOCR.useMutation()
      const result = await simulateOCRAnalysis(image.preview);

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, result, isAnalyzing: false } : img
        )
      );
      // Atualizar ocrText para análise de URLs
      if (result?.extractedText) {
        setOcrText(result.extractedText);
      }
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, isAnalyzing: false } : img
        )
      );
    }
  };

  const analyzeAllImages = () => {
    images.forEach((img) => {
      if (!img.result && !img.isAnalyzing) {
        analyzeImage(img.id);
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📸 Screenshot Analyzer com OCR
        </h2>
        <p className="text-gray-400">
          Analise capturas de tela para detectar URLs, e-mails, telefones, PIX, frases de risco e marcas falsificadas
        </p>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-cyan-500/50 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleMultipleImages}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
        <p className="text-white font-semibold mb-1">Clique para fazer upload de imagens</p>
        <p className="text-gray-400 text-sm">ou arraste arquivos aqui (máx. 10 imagens, 5MB cada)</p>
      </div>

      {/* Analyze All Button */}
      {images.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={analyzeAllImages}
            className="bg-cyan-600 hover:bg-cyan-700"
            disabled={images.every((img) => img.result || img.isAnalyzing)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analisar Todas
          </Button>
          <Button
            onClick={() => setImages([])}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Image Preview */}
            <div className="relative w-full h-48 bg-black overflow-hidden">
              <img
                src={image.preview}
                alt="preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Analysis Result */}
            {image.isAnalyzing ? (
              <div className="p-4 flex items-center justify-center gap-2 text-cyan-400">
                <Loader className="w-4 h-4 animate-spin" />
                Analisando...
              </div>
            ) : image.result ? (
              <div className="p-4 space-y-3">
                {/* Risk Badge */}
                <div className={`p-3 rounded-lg border ${getRiskColor(image.result.riskLevel)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Nível de Risco</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeColor(image.result.riskLevel)}`}>
                      {image.result.riskScore}%
                    </span>
                  </div>
                  <p className="text-sm">{image.result.recommendation.split(':')[0]}</p>
                </div>

                {/* Indicators Summary */}
                <div className="space-y-2 text-sm">
                  {image.result.indicators.urls.length > 0 && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <span>🔗 URLs:</span>
                      <span className="font-semibold">{image.result.indicators.urls.length}</span>
                    </div>
                  )}
                  {image.result.indicators.emails.length > 0 && (
                    <div className="flex items-center gap-2 text-purple-400">
                      <span>📧 E-mails:</span>
                      <span className="font-semibold">{image.result.indicators.emails.length}</span>
                    </div>
                  )}
                  {image.result.indicators.phones.length > 0 && (
                    <div className="flex items-center gap-2 text-green-400">
                      <span>📱 Telefones:</span>
                      <span className="font-semibold">{image.result.indicators.phones.length}</span>
                    </div>
                  )}
                  {image.result.indicators.pixKeys.length > 0 && (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <span>💰 Chaves PIX:</span>
                      <span className="font-semibold">{image.result.indicators.pixKeys.length}</span>
                    </div>
                  )}
                  {image.result.detectedBrands.length > 0 && (
                    <div className="flex items-center gap-2 text-red-400">
                      <span>🏢 Marcas:</span>
                      <span className="font-semibold">{image.result.detectedBrands.length}</span>
                    </div>
                  )}
                  {image.result.hasQRCode && (
                    <div className="flex items-center gap-2 text-orange-400">
                      <span>📲 QR Code detectado</span>
                    </div>
                  )}
                </div>

                {/* Expand Button */}
                <button
                  onClick={() =>
                    setExpandedImage(expandedImage === image.id ? null : image.id)
                  }
                  className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded text-cyan-400 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {expandedImage === image.id ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Ocultar Detalhes
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Ver Detalhes
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4">
                <Button
                  onClick={() => analyzeImage(image.id)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  Analisar
                </Button>
              </div>
            )}

            {/* Expanded Details */}
            {expandedImage === image.id && image.result && (
              <div className="border-t border-gray-700 p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Recommendation */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                  <p className="text-sm text-blue-300">{image.result.recommendation}</p>
                </div>

                {/* URLs */}
                {image.result.indicators.urls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">URLs Detectadas</h4>
                    <div className="space-y-1">
                      {image.result.indicators.urls.slice(0, 3).map((url, i) => (
                        <div key={i} className="text-xs text-gray-400 truncate" title={url}>
                          🔗 {url}
                        </div>
                      ))}
                      {image.result.indicators.urls.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{image.result.indicators.urls.length - 3} mais...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* E-mails */}
                {image.result.indicators.emails.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">E-mails Detectados</h4>
                    <div className="space-y-1">
                      {image.result.indicators.emails.map((email, i) => (
                        <div key={i} className="text-xs text-gray-400">
                          📧 {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Telefones */}
                {image.result.indicators.phones.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-2">Telefones Detectados</h4>
                    <div className="space-y-1">
                      {image.result.indicators.phones.map((phone, i) => (
                        <div key={i} className="text-xs text-gray-400">
                          📱 {phone}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PIX Keys */}
                {image.result.indicators.pixKeys.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">Chaves PIX Detectadas</h4>
                    <div className="space-y-1">
                      {image.result.indicators.pixKeys.slice(0, 3).map((key, i) => (
                        <div key={i} className="text-xs text-gray-400 truncate" title={key}>
                          💰 {key}
                        </div>
                      ))}
                      {image.result.indicators.pixKeys.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{image.result.indicators.pixKeys.length - 3} mais...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Phrases */}
                {image.result.indicators.riskPhrases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Frases de Risco Detectadas</h4>
                    <div className="space-y-1">
                      {image.result.indicators.riskPhrases.slice(0, 5).map((phrase, i) => (
                        <div key={i} className="text-xs text-gray-400">
                          ⚠️ {phrase}
                        </div>
                      ))}
                      {image.result.indicators.riskPhrases.length > 5 && (
                        <div className="text-xs text-gray-500">
                          +{image.result.indicators.riskPhrases.length - 5} mais...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Extracted Text */}
                <button
                  onClick={() =>
                    setShowExtractedText(
                      showExtractedText === image.id ? null : image.id
                    )
                  }
                  className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 text-xs flex items-center justify-center gap-2"
                >
                  {showExtractedText === image.id ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Ocultar Texto Extraído
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Ver Texto Extraído
                    </>
                  )}
                </button>

                {showExtractedText === image.id && (
                  <div className="bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
                    <p className="text-xs text-gray-300 whitespace-pre-wrap">
                      {image.result.extractedText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MITRE ATT&CK MAPPING */}
      {images.some(img => img.result) && (
        <div className="mt-6">
          <MITREAttackDisplay
            techniques={(() => {
              const techniques: any[] = [];
              const seen = new Set<string>();
              
              // Verificar se há indicadores de engenharia social
              images.forEach(img => {
                if (img.result) {
                  if (img.result.indicators.socialEngineeringTerms.length > 0 || img.result.riskScore > 60) {
                    const tech = {
                      id: 'T1598',
                      name: 'Phishing for Information',
                      tactic: 'Reconnaissance',
                      description: 'Engenharia social detectada em imagem para coleta de informacoes',
                      url: 'https://attack.mitre.org/techniques/T1598/',
                      confidence: Math.min(90, 50 + img.result.riskScore),
                    };
                    if (!seen.has(tech.id)) {
                      techniques.push(tech);
                      seen.add(tech.id);
                    }
                  }
                  
                  if (img.result.indicators.urls.length > 0 || img.result.indicators.pixKeys.length > 0) {
                    const tech = {
                      id: 'T1566',
                      name: 'Phishing',
                      tactic: 'Initial Access',
                      description: 'Indicadores de phishing detectados em imagem',
                      url: 'https://attack.mitre.org/techniques/T1566/',
                      confidence: Math.min(85, 40 + img.result.riskScore),
                    };
                    if (!seen.has(tech.id)) {
                      techniques.push(tech);
                      seen.add(tech.id);
                    }
                  }
                }
              });
              
              return techniques;
            })()}
          />
        </div>
      )}

      {/* Screenshot URLhaus Analysis */}
      {screenshotURLsQuery.data?.data && (
        <div className="mt-6">
          <ScreenshotURLhausAnalysis
            data={screenshotURLsQuery.data.data}
            isLoading={screenshotURLsQuery.isLoading}
          />
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nenhuma imagem selecionada</p>
          <p className="text-sm">Faça upload de capturas de tela para análise</p>
        </div>
      )}
    </div>
  );
}

/**
 * Simular análise OCR (será substituído por chamada real ao backend)
 */
async function simulateOCRAnalysis(imageData: string): Promise<ScreenshotOCRResult> {
  // Simular delay de processamento
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simular resultado
  return {
    extractedText: `Olá! Sua conta foi bloqueada. 
    Clique aqui para desbloquear: http://bit.ly/verify-account
    Confirme seus dados: CPF: 123.456.789-00
    Envie PIX para: 12345678-1234-1234-1234-123456789012
    Telefone: (11) 98765-4321
    Email: suporte@banco-fake.com
    Ação necessária AGORA!`,
    indicators: {
      text: 'Olá! Sua conta foi bloqueada...',
      urls: ['http://bit.ly/verify-account'],
      domains: ['bit.ly'],
      emails: ['suporte@banco-fake.com'],
      phones: ['(11) 98765-4321'],
      pixKeys: ['12345678-1234-1234-1234-123456789012', '123.456.789-00'],
      riskPhrases: ['bloqueada', 'clique aqui', 'ação necessária agora'],
      brandNames: ['banco'],
      urgencyIndicators: ['ação necessária agora', 'clique aqui'],
      socialEngineeringTerms: ['confirme seus dados'],
    },
    riskScore: 92,
    riskLevel: 'crítico',
    detectedBrands: ['Banco Fake'],
    recommendation: '🚨 ALERTA CRÍTICO: Esta imagem apresenta múltiplos indicadores de phishing/golpe. NÃO clique em links, NÃO confirme dados e NÃO escaneie QR Codes. Verifique diretamente no aplicativo oficial da empresa.',
    hasQRCode: false,
  };
}
