export interface ImageAnalysisResult {
  extractedText: string;
  detectedElements: {
    qrCodes: number;
    pixKeywords: number;
    phoneNumbers: string[];
    emailAddresses: string[];
    urls: string[];
    suspiciousLogos: string[];
    urgencyIndicators: string[];
    identityFalsifications: string[];
  };
  suspiciousPatterns: {
    pattern: string;
    confidence: number;
    description: string;
  }[];
  riskScore: number;
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'crítico';
  recommendations: string[];
}

const IDENTITY_KEYWORDS = {
  'Receita Federal': ['receita federal', 'imposto de renda', 'declaração', 'pendência fiscal', 'irpf'],
  'Banco do Brasil': ['banco do brasil', 'bb', 'conta bloqueada', 'segurança bancária'],
  'Itaú': ['itaú', 'itau', 'agência', 'conta itau'],
  'Bradesco': ['bradesco', 'bradesco net', 'conta bradesco'],
  'Caixa': ['caixa', 'caixa econômica', 'fgts', 'auxílio emergencial'],
  'Correios': ['correios', 'encomenda', 'pacote', 'rastreamento'],
  'WhatsApp': ['whatsapp', 'verificação whatsapp', 'confirme sua conta'],
  'YouTube': ['youtube', 'canal youtube', 'monetização', 'ganhe dinheiro'],
  'Gov.br': ['gov.br', 'governo federal', 'portal gov'],
  'Polícia Federal': ['polícia federal', 'pf', 'investigação', 'crime'],
  'Amazon': ['amazon', 'sua conta foi bloqueada', 'confirme identidade'],
  'PayPal': ['paypal', 'sua conta paypal', 'verificação paypal'],
};

const SUSPICIOUS_KEYWORDS = [
  'urgente', 'imediatamente', 'agora', 'rápido', 'clique já', 'não espere',
  'bloqueado', 'suspenso', 'cancelado', 'fraude', 'crime', 'multa', 'prisão',
  'confirme', 'verifique', 'valide', 'atualizar dados', 'senha', 'código',
  'pix', 'transferência', 'dinheiro', 'ganhe', 'renda extra', 'fácil',
];

export async function analyzeImageWithAI(
  imageUrl: string,
  invokeLLMFn: (params: any) => Promise<any>
): Promise<ImageAnalysisResult> {
  try {
    const systemPrompt = `Você é um especialista em segurança cibernética e detecção de golpes digitais. 
Analise a imagem fornecida e identifique:
1. Todo o texto visível na imagem
2. QR Codes (quantidade)
3. Números de telefone
4. Endereços de email
5. URLs ou links
6. Logos de instituições (especialmente logos falsificados ou mal formatados)
7. Palavras que indicam urgência ou pressão psicológica
8. Tentativas de falsificação de identidade (Receita Federal, Bancos, Correios, etc)
9. Indicadores de engenharia social

Responda em JSON com a seguinte estrutura:
{
  "extractedText": "todo o texto extraído",
  "qrCodes": número,
  "pixKeywords": número,
  "phoneNumbers": ["lista de números"],
  "emailAddresses": ["lista de emails"],
  "urls": ["lista de urls"],
  "suspiciousLogos": ["lista de logos suspeitos"],
  "urgencyIndicators": ["lista de indicadores de urgência"],
  "identityFalsifications": ["lista de falsificações de identidade detectadas"],
  "suspiciousPatterns": [
    {"pattern": "descrição", "confidence": 0-100, "description": "explicação"}
  ]
}`;

    const response = await invokeLLMFn({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Analise esta imagem para detectar padrões de golpe, engenharia social e falsificação de identidade. Forneça a resposta em JSON.",
            },
          ] as any,
        },
      ],
    });

    const content = response.choices[0].message.content;
    let analysisData;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      analysisData = parseAnalysisResponse(content);
    }

    const riskScore = calculateRiskScore(analysisData);
    const riskLevel = getRiskLevel(riskScore);
    const recommendations = generateRecommendations(analysisData, riskScore);

    return {
      extractedText: analysisData.extractedText || "",
      detectedElements: {
        qrCodes: analysisData.qrCodes || 0,
        pixKeywords: analysisData.pixKeywords || 0,
        phoneNumbers: analysisData.phoneNumbers || [],
        emailAddresses: analysisData.emailAddresses || [],
        urls: analysisData.urls || [],
        suspiciousLogos: analysisData.suspiciousLogos || [],
        urgencyIndicators: analysisData.urgencyIndicators || [],
        identityFalsifications: analysisData.identityFalsifications || [],
      },
      suspiciousPatterns: analysisData.suspiciousPatterns || [],
      riskScore,
      riskLevel,
      recommendations,
    };
  } catch (error) {
    console.error("Error analyzing image with AI:", error);
    throw new Error("Falha ao analisar imagem com IA");
  }
}

function calculateRiskScore(data: any): number {
  let score = 0;

  if (data.qrCodes) score += Math.min(data.qrCodes * 30, 50);
  if (data.pixKeywords && data.pixKeywords > 0) score += 35;
  if (data.urgencyIndicators && Array.isArray(data.urgencyIndicators)) {
    score += Math.min(data.urgencyIndicators.length * 20, 40);
  }
  if (data.identityFalsifications && Array.isArray(data.identityFalsifications)) {
    score += Math.min(data.identityFalsifications.length * 40, 60);
  }
  if (data.suspiciousLogos && Array.isArray(data.suspiciousLogos)) {
    score += Math.min(data.suspiciousLogos.length * 25, 50);
  }
  if (data.urls && Array.isArray(data.urls)) {
    score += Math.min(data.urls.length * 15, 40);
  }
  if (data.suspiciousPatterns && Array.isArray(data.suspiciousPatterns)) {
    score += Math.min(data.suspiciousPatterns.length * 10, 30);
  }

  return Math.min(score, 100);
}

function getRiskLevel(score: number): 'baixo' | 'moderado' | 'alto' | 'crítico' {
  if (score < 20) return 'baixo';
  if (score < 50) return 'moderado';
  if (score < 75) return 'alto';
  return 'crítico';
}

function generateRecommendations(data: any, riskScore: number): string[] {
  const recommendations: string[] = [];

  if (data.qrCodes && data.qrCodes > 0) {
    recommendations.push("❌ Não escaneie QR Codes de fontes desconhecidas");
  }

  if (data.pixKeywords && data.pixKeywords > 0) {
    recommendations.push("❌ Não envie PIX sem confirmar por ligação para número conhecido");
  }

  if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
    recommendations.push("❌ Não clique em links encurtados ou suspeitos");
  }

  if (data.identityFalsifications && Array.isArray(data.identityFalsifications) && data.identityFalsifications.length > 0) {
    recommendations.push(`✓ Verifique a identidade de ${data.identityFalsifications[0]} através de canal oficial`);
  }

  if (data.urgencyIndicators && Array.isArray(data.urgencyIndicators) && data.urgencyIndicators.length > 0) {
    recommendations.push("✓ Desconfie de mensagens com urgência ou ameaças");
  }

  if (riskScore >= 75) {
    recommendations.push("🚨 Esta imagem apresenta características de golpe. Não interaja com nenhum elemento.");
  } else if (riskScore >= 50) {
    recommendations.push("⚠️ Esta imagem apresenta características suspeitas. Verifique antes de agir.");
  }

  return recommendations.length > 0 ? recommendations : ["✓ Nenhum padrão de golpe detectado"];
}

function parseAnalysisResponse(text: string): any {
  const result = {
    extractedText: text,
    qrCodes: (text.match(/qr\s*code/gi) || []).length,
    pixKeywords: (text.match(/\bpix\b/gi) || []).length,
    phoneNumbers: text.match(/\d{2}\s?\d{4,5}-?\d{4}/g) || [],
    emailAddresses: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [],
    urls: text.match(/https?:\/\/[^\s]+/g) || [],
    suspiciousLogos: [],
    urgencyIndicators: SUSPICIOUS_KEYWORDS.filter(kw => text.toLowerCase().includes(kw)),
    identityFalsifications: Object.keys(IDENTITY_KEYWORDS).filter(identity =>
      IDENTITY_KEYWORDS[identity as keyof typeof IDENTITY_KEYWORDS].some(kw =>
        text.toLowerCase().includes(kw)
      )
    ),
    suspiciousPatterns: [],
  };

  return result;
}
