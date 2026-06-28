/**
 * Screenshot OCR & Indicator Extraction Module
 * Extrai texto, URLs, e-mails, telefones, PIX, e indicadores de risco de imagens
 */

import { invokeLLM } from "./core/llm";

export interface ExtractedIndicators {
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

export interface ScreenshotAnalysisResult {
  extractedText: string;
  indicators: ExtractedIndicators;
  riskScore: number;
  riskLevel: 'baixo' | 'médio' | 'alto' | 'crítico';
  detectedBrands: string[];
  recommendation: string;
  hasQRCode: boolean;
}

// Frases de risco e urgência em português
const RISK_PHRASES = {
  urgency: [
    'acesso não reconhecido',
    'bloqueie sua conta',
    'confirme seus dados',
    'evite restrições',
    'pendência no cadastro',
    'pagamento pendente',
    'sua encomenda foi retida',
    'clique imediatamente',
    'código de segurança',
    'tarefa remunerada',
    'bônus de boas-vindas',
    'ação necessária',
    'verifique agora',
    'confirme imediatamente',
    'atualize seus dados',
    'valide sua conta',
    'limite atingido',
    'conta suspensa',
    'acesso restrito',
    'operação bloqueada',
    'tempo limitado',
    'oferta expirando',
    'prêmio aguardando',
    'resgate seu prêmio',
    'ganhou um prêmio',
    'clique aqui agora',
    'não perca',
    'aproveite agora',
    'últimas vagas',
    'vagas limitadas',
  ],
  socialEngineering: [
    'confirme seus dados',
    'atualize suas informações',
    'valide sua identidade',
    'verifique sua conta',
    'atualize seu cadastro',
    'confirme seu CPF',
    'confirme seu RG',
    'confirme sua senha',
    'insira seu PIN',
    'digite seu código',
    'autentique-se',
    'faça login',
    'entre em sua conta',
    'acesse sua conta',
    'clique no link',
    'abra o link',
    'visite o site',
    'acesse o site',
    'baixe o aplicativo',
    'instale o app',
    'atualize o app',
    'autorize o acesso',
    'permita o acesso',
    'conceda permissão',
    'compartilhe seu código',
    'envie seu código',
    'forneça seu código',
    'digite o código',
    'confirme o código',
  ],
};

// Marcas brasileiras conhecidas (para detecção de falsificação)
const KNOWN_BRANDS = [
  'banco do brasil',
  'itaú',
  'bradesco',
  'santander',
  'caixa',
  'nubank',
  'inter',
  'c6 bank',
  'bb',
  'bbbank',
  'itaubank',
  'bradesco bank',
  'caixa econômica',
  'banco central',
  'bcb',
  'whatsapp',
  'instagram',
  'facebook',
  'telegram',
  'paypal',
  'mercado pago',
  'pix',
  'picpay',
  'nubank',
  'amazon',
  'amazon.com.br',
  'ebay',
  'shopee',
  'alibaba',
  'aliexpress',
  'correios',
  'sedex',
  'transportadora',
  'loggi',
  'ifood',
  'uber',
  'uber eats',
  '99food',
  'rappi',
  'didi',
  'spotify',
  'netflix',
  'disney+',
  'apple',
  'microsoft',
  'google',
  'samsung',
  'lg',
  'sony',
  'dell',
  'hp',
  'lenovo',
  'asus',
  'motorola',
  'xiaomi',
  'huawei',
  'nokia',
  'positivo',
  'multilaser',
  'intelbras',
  'positivo',
  'claro',
  'vivo',
  'tim',
  'oi',
  'algar',
  'gvt',
  'embratel',
  'net',
  'sky',
  'oi tv',
  'globoplay',
  'telecine',
  'hbo',
  'paramount+',
  'crunchyroll',
  'prime video',
  'youtube',
  'twitch',
  'tiktok',
  'pinterest',
  'reddit',
  'linkedin',
  'github',
  'gitlab',
  'bitbucket',
  'dropbox',
  'google drive',
  'onedrive',
  'icloud',
  'mega',
  'mediafire',
  'wetransfer',
  'canva',
  'figma',
  'adobe',
  'photoshop',
  'illustrator',
  'premiere',
  'after effects',
  'indesign',
  'lightroom',
  'acrobat',
  'reader',
  'slack',
  'discord',
  'zoom',
  'meet',
  'teams',
  'skype',
  'jira',
  'confluence',
  'trello',
  'asana',
  'monday',
  'notion',
  'evernote',
  'onenote',
  'notion',
  'todoist',
  'wunderlist',
  'anydo',
  'remember the milk',
  'wrike',
  'basecamp',
  'smartsheet',
  'monday.com',
  'hubspot',
  'salesforce',
  'pipedrive',
  'zendesk',
  'intercom',
  'drift',
  'olark',
  'livechat',
  'freshdesk',
  'helpscout',
  'groove',
  'desk.com',
  'kayako',
  'jira service desk',
  'servicenow',
  'remedy',
  'cherwell',
  'ivanti',
  'bmc helix',
  'atlassian',
  'jetbrains',
  'visual studio',
  'vscode',
  'sublime',
  'atom',
  'brackets',
  'webstorm',
  'phpstorm',
  'pycharm',
  'clion',
  'rider',
  'goland',
  'rubymine',
  'appcode',
  'datagrip',
  'resharper',
  'dotcover',
  'dotmemory',
  'dotpeek',
  'dotprofile',
  'dottrace',
  'rider',
  'teamcity',
  'youtrack',
  'upsource',
  'crucible',
  'fisheye',
  'bamboo',
  'bitbucket pipelines',
  'github actions',
  'gitlab ci',
  'circleci',
  'travis ci',
  'jenkins',
  'drone',
  'appveyor',
  'azure devops',
  'gitlab',
  'gitea',
  'gogs',
  'gitbucket',
  'gitlab',
  'gitblit',
  'gitorious',
  'gitweb',
  'cgit',
  'gitolite',
  'gitosis',
  'gitdeploy',
  'gitpush',
  'gitpull',
  'gitfetch',
  'gitmerge',
  'gitrebase',
  'gitcherry',
  'gitpick',
  'gitbisect',
  'gitblame',
  'gitlog',
  'gitshow',
  'gitdiff',
  'gitstatus',
  'gitadd',
  'gitcommit',
  'gitpush',
  'gitpull',
  'gitfetch',
  'gitmerge',
  'gitrebase',
  'gitcherry',
  'gitpick',
  'gitbisect',
  'gitblame',
  'gitlog',
  'gitshow',
  'gitdiff',
  'gitstatus',
  'gitadd',
  'gitcommit',
];

/**
 * Extrair texto de imagem usando Claude Vision API
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Extraia TODO o texto visível nesta imagem. Mantenha a formatação e estrutura. Retorne apenas o texto extraído, sem explicações.',
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content === 'string') {
      return content;
    }
    return '';
  } catch (error) {
    console.error('Erro ao extrair texto da imagem:', error);
    return '';
  }
}

/**
 * Extrair URLs de texto
 */
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches.map(url => url.toLowerCase()))];
}

/**
 * Extrair domínios de URLs
 */
function extractDomains(urls: string[]): string[] {
  const domains = urls
    .map(url => {
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname;
      } catch {
        return null;
      }
    })
    .filter((d): d is string => d !== null);

  return [...new Set(domains)];
}

/**
 * Extrair e-mails de texto
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return [...new Set(matches.map(email => email.toLowerCase()))];
}

/**
 * Extrair telefones brasileiros
 */
function extractPhones(text: string): string[] {
  const phoneRegex = /(?:\+55|55)?[\s-]?(?:\(?\d{2}\)?)?[\s-]?9?[\s-]?\d{4}[\s-]?\d{4}/g;
  const matches = text.match(phoneRegex) || [];
  return [...new Set(matches)];
}

/**
 * Extrair chaves PIX (CPF, CNPJ, Email, Telefone, Aleatória)
 */
function extractPixKeys(text: string): string[] {
  const pixKeys: string[] = [];

  // CPF: XXX.XXX.XXX-XX ou XXXXXXXXXXX
  const cpfRegex = /(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})/g;
  const cpfs = text.match(cpfRegex) || [];
  pixKeys.push(...cpfs);

  // CNPJ: XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX
  const cnpjRegex = /(?:\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})/g;
  const cnpjs = text.match(cnpjRegex) || [];
  pixKeys.push(...cnpjs);

  // Email PIX (já extraído acima)
  // Telefone PIX (já extraído acima)

  // UUID/Chave aleatória PIX: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const uuids = text.match(uuidRegex) || [];
  pixKeys.push(...uuids);

  return [...new Set(pixKeys)];
}

/**
 * Detectar frases de risco em texto
 */
function detectRiskPhrases(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  // Detectar frases de urgência
  RISK_PHRASES.urgency.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      detected.push(phrase);
    }
  });

  // Detectar termos de engenharia social
  RISK_PHRASES.socialEngineering.forEach(term => {
    if (lowerText.includes(term)) {
      detected.push(term);
    }
  });

  return [...new Set(detected)];
}

/**
 * Detectar marcas conhecidas em texto
 */
function detectBrands(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  KNOWN_BRANDS.forEach(brand => {
    if (lowerText.includes(brand)) {
      detected.push(brand);
    }
  });

  return [...new Set(detected)];
}

/**
 * Detectar QR Code em imagem (via descrição visual)
 */
async function detectQRCode(imageUrl: string): Promise<boolean> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Há um QR Code visível nesta imagem? Responda apenas "sim" ou "não".',
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content === 'string') {
      return content.toLowerCase().includes('sim');
    }
    return false;
  } catch (error) {
    console.error('Erro ao detectar QR Code:', error);
    return false;
  }
}

/**
 * Calcular score de risco baseado em indicadores
 */
function calculateRiskScore(indicators: ExtractedIndicators, brands: string[]): number {
  let score = 0;

  // URLs suspeitas (0-20 pontos)
  if (indicators.urls.length > 0) {
    score += Math.min(indicators.urls.length * 5, 20);
  }

  // Frases de risco (0-30 pontos)
  score += Math.min(indicators.riskPhrases.length * 10, 30);

  // Termos de engenharia social (0-25 pontos)
  score += Math.min(indicators.socialEngineeringTerms.length * 8, 25);

  // Indicadores de urgência (0-15 pontos)
  score += Math.min(indicators.urgencyIndicators.length * 5, 15);

  // Marcas conhecidas (bônus de risco se falsificadas) (0-10 pontos)
  if (brands.length > 0) {
    score += Math.min(brands.length * 5, 10);
  }

  // PIX keys (0-10 pontos)
  if (indicators.pixKeys.length > 0) {
    score += Math.min(indicators.pixKeys.length * 3, 10);
  }

  // QR Code (0-5 pontos)
  // (adicionado na função principal)

  return Math.min(score, 100);
}

/**
 * Classificar nível de risco
 */
function classifyRiskLevel(score: number): 'baixo' | 'médio' | 'alto' | 'crítico' {
  if (score >= 80) return 'crítico';
  if (score >= 60) return 'alto';
  if (score >= 40) return 'médio';
  return 'baixo';
}

/**
 * Gerar recomendação baseada no risco
 */
function generateRecommendation(
  riskLevel: 'baixo' | 'médio' | 'alto' | 'crítico',
  indicators: ExtractedIndicators,
  brands: string[]
): string {
  if (riskLevel === 'crítico') {
    return '🚨 ALERTA CRÍTICO: Esta imagem apresenta múltiplos indicadores de phishing/golpe. NÃO clique em links, NÃO confirme dados e NÃO escaneie QR Codes. Verifique diretamente no aplicativo oficial da empresa.';
  }

  if (riskLevel === 'alto') {
    if (brands.length > 0) {
      return `⚠️ ALTO RISCO: Detectada tentativa de falsificação da marca "${brands[0]}". Esta imagem contém características compatíveis com phishing. Não clique em links ou botões. Acesse o aplicativo oficial para verificar.`;
    }
    return '⚠️ ALTO RISCO: Esta imagem contém múltiplos indicadores de phishing/engenharia social. Não clique em links ou confirme dados pessoais.';
  }

  if (riskLevel === 'médio') {
    if (indicators.riskPhrases.length > 0) {
      return `⚠️ RISCO MÉDIO: Detectadas frases de urgência ("${indicators.riskPhrases[0]}"). Seja cauteloso antes de clicar em links. Verifique a origem através de canais oficiais.`;
    }
    return '⚠️ RISCO MÉDIO: Esta imagem contém alguns indicadores suspeitos. Verifique a origem antes de tomar ações.';
  }

  return '✅ RISCO BAIXO: Nenhum indicador significativo de phishing detectado. Mas sempre verifique a origem de mensagens com pessoas conhecidas.';
}

/**
 * Analisar screenshot completo
 */
export async function analyzeScreenshot(imageUrl: string): Promise<ScreenshotAnalysisResult> {
  // Extrair texto
  const extractedText = await extractTextFromImage(imageUrl);

  // Extrair indicadores
  const urls = extractUrls(extractedText);
  const domains = extractDomains(urls);
  const emails = extractEmails(extractedText);
  const phones = extractPhones(extractedText);
  const pixKeys = extractPixKeys(extractedText);
  const riskPhrases = detectRiskPhrases(extractedText);
  const brands = detectBrands(extractedText);

  // Separar urgência e engenharia social
  const urgencyIndicators = riskPhrases.filter(phrase =>
    RISK_PHRASES.urgency.includes(phrase)
  );
  const socialEngineeringTerms = riskPhrases.filter(phrase =>
    RISK_PHRASES.socialEngineering.includes(phrase)
  );

  const indicators: ExtractedIndicators = {
    text: extractedText,
    urls,
    domains,
    emails,
    phones,
    pixKeys,
    riskPhrases,
    brandNames: brands,
    urgencyIndicators,
    socialEngineeringTerms,
  };

  // Detectar QR Code
  const hasQRCode = await detectQRCode(imageUrl);

  // Calcular score de risco
  let riskScore = calculateRiskScore(indicators, brands);
  if (hasQRCode) {
    riskScore += 5; // Bônus por QR Code
  }
  riskScore = Math.min(riskScore, 100);

  // Classificar risco
  const riskLevel = classifyRiskLevel(riskScore);

  // Gerar recomendação
  const recommendation = generateRecommendation(riskLevel, indicators, brands);

  return {
    extractedText,
    indicators,
    riskScore,
    riskLevel,
    detectedBrands: brands,
    recommendation,
    hasQRCode,
  };
}
