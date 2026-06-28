/**
 * Funções de Detecção de URLs Maliciosas
 * Implementa as 30 melhorias para análise de segurança
 * 
 * CRÍTICO: Verificar whitelist ANTES de aplicar heurísticas de typosquatting
 */

// ============================================
// WHITELIST DE DOMÍNIOS CONFIÁVEIS
// ============================================
const TRUSTED_DOMAINS_WHITELIST = new Set([
  // Google
  'google.com',
  'googleusercontent.com',
  'drive.google.com',
  'docs.google.com',
  'sheets.google.com',
  'slides.google.com',
  'forms.google.com',
  'meet.google.com',
  'calendar.google.com',
  'analytics.google.com',
  'ads.google.com',
  'gmail.com',
  'youtube.com',

  // Microsoft
  'microsoft.com',
  'sharepoint.com',
  'onedrive.com',
  'office.com',
  'office365.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'teams.microsoft.com',
  'azure.microsoft.com',

  // GitHub
  'github.com',
  'github.io',

  // LinkedIn
  'linkedin.com',

  // Dropbox
  'dropbox.com',

  // Adobe
  'adobe.com',
  'creative.adobe.com',
  'acrobat.adobe.com',

  // Cloudflare
  'cloudflare.com',
  'dash.cloudflare.com',

  // Meta
  'whatsapp.com',
  'web.whatsapp.com',
  'facebook.com',
  'instagram.com',
  'messenger.com',
  'meta.com',

  // AWS
  'aws.amazon.com',
  'amazon.com',

  // Bancos Brasileiros
  'bb.com.br',
  'itau.com.br',
  'bradesco.com.br',
  'caixa.gov.br',
  'nubank.com.br',
  'santander.com.br',

  // Outros
  'apple.com',
  'icloud.com',
  'telegram.org',
  'twitter.com',
  'reddit.com',
  'wikipedia.org',
  'stackoverflow.com',
  'stripe.com',
  'paypal.com',
  'docusign.com',
  'slack.com',
  'notion.so',
  'figma.com',
  'zoom.us',
]);

/**
 * Extrair domínio principal de uma URL
 * Exemplo: https://mail.google.com → google.com
 * Exemplo: https://u2ccustom-my.sharepoint.com → sharepoint.com
 */
export function extractMainDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const parts = hostname.split('.');

    // Tratamento especial para sharepoint.com
    if (hostname.includes('sharepoint.com')) {
      return 'sharepoint.com';
    }

    // Tratamento especial para onedrive
    if (hostname.includes('onedrive.com') || hostname.includes('my.sharepoint.com')) {
      return 'onedrive.com';
    }

    // Se tem 3+ partes, retorna as 2 últimas (domínio + TLD)
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }

    return hostname;
  } catch {
    return '';
  }
}

/**
 * Verificar se domínio é confiável (whitelist)
 */
export function isTrustedDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().trim();
  return TRUSTED_DOMAINS_WHITELIST.has(normalized);
}

export const detectarWhatsApp = (url: string) => {
  return url.includes("wa.me") || url.includes("api.whatsapp.com");
};

export const urlMuitoLonga = (url: string) => {
  return url.length > 120;
};

export const excessoNumeros = (url: string) => {
  const numeros = url.match(/\d/g);
  return Boolean(numeros && numeros.length > 8);
};

export const muitosSubdominios = (hostname: string) => {
  return hostname.split(".").length > 4;
};

export const encurtadores = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "cutt.ly",
  "rebrand.ly",
  "is.gd",
  "ow.ly",
  "shorturl.at"
];

export const detectarEncurtador = (url: string, isTrusted: boolean = false) => {
  // Nunca marcar domínios confiáveis como encurtadores
  if (isTrusted) return false;
  
  // Verificar apenas domínios específicos de encurtadores
  return encurtadores.some(encurtador => url.includes(encurtador));
};

/**
 * CORRIGIDO: Detectar typosquatting com verificação de whitelist PRIMEIRO
 * 
 * Algoritmo melhorado:
 * 1. Se domínio está na whitelist → NUNCA marcar como typosquatting
 * 2. Se domínio está na whitelist → Não aplicar heurísticas de phishing
 * 3. Comparar apenas domínios suspeitos (não contra si mesmo)
 */
export const detectarTyposquatting = (hostname: string): boolean => {
  const mainDomain = extractMainDomain(`https://${hostname}`);

  // CRÍTICO: Se domínio é confiável, NUNCA marcar como typosquatting
  if (isTrustedDomain(mainDomain)) {
    return false;
  }

  // Marcas conhecidas com variações suspeitas
  const marcasConhecidas: Record<string, string[]> = {
    "whatsapp": ["whats-app", "wh-atsapp", "whatsapp-verify", "whatsapp-confirm", "whatsapp-login", "whatsapp-security"],
    "nubank": ["nub4nk", "nu-bank", "nubank-login", "nubank-verify", "nubank-seguro", "nubank-seguranca"],
    "mercadolivre": ["mercado-livre", "mercadolibre-verify"],
    "gov": ["gov-verify", "gov-confirm"],
    "caixa": ["caixa-login", "caixa-verify", "caixa-seguro"],
    "itau": ["itau-login", "itau-verify", "itau-seguro"],
    "bradesco": ["bradesco-login", "bradesco-verify"],
    "inter": ["inter-login", "inter-verify"],
    "picpay": ["picpay-login", "picpay-verify"],
    "google": ["g00gle", "goog1e", "gooogle", "goggle", "gogle"],
    "microsoft": ["microso1t", "micr0soft", "microsft"],
    "paypal": ["paypa1", "paypal-confirm", "paypal-verify"],
  };

  const normalizedHostname = hostname.toLowerCase();

  // Verificar cada marca
  for (const [marca, typos] of Object.entries(marcasConhecidas)) {
    // Não comparar contra si mesmo
    if (normalizedHostname === `${marca}.com` || normalizedHostname === `${marca}.com.br`) {
      continue;
    }

    // Verificar se alguma variação suspeita está presente
    for (const typo of typos) {
      if (normalizedHostname.includes(typo)) {
        return true;
      }
    }
  }

  return false;
};

export const scamPatterns = [
  { pattern: /verify|confirm|update|urgent|act now/i },
  { pattern: /click here|clique aqui|toque aqui/i }
];

// Detectar domínio muito longo (>= 30 caracteres)
export const dominioMuitoLongo = (hostname: string) => {
  return hostname.length >= 30;
};

/**
 * Calcular score com prioridade para whitelist
 */
export const calcularScore = (riscos: any) => {
  let score = 0;

  // Se é domínio confiável, começar com score muito baixo
  if (riscos.trustedDomain) {
    score = 0; // Começar do zero
    
    // Apenas adicionar pontos se houver evidências externas
    if (riscos.virusTotalMalicious) score += 30;
    if (riscos.abuseIPDBScore) score += 25;
    if (riscos.urlhausMalware) score += 35;
    
    return Math.min(score, 30); // Máximo 30 para domínios confiáveis
  }

  // Para domínios não confiáveis, aplicar lógica de pontuação dinâmica
  // Baseado na sugestão de Thiago: Pontuação por severidade
  
  // Ameaças críticas (100 pontos)
  if (riscos.blacklist) score += 100;           // Blacklist = +100
  if (riscos.urlhausMalware) score += 100;      // Malware confirmado = +100
  if (riscos.virusTotalMalicious) score += 100; // Phishing confirmado = +100
  if (riscos.golpeOrgaoPublico) score += 50;    // Golpe de órgão público = +50
  
  // Ameaças moderadas-altas (50 pontos)
  if (riscos.typosquatting) score += 50;        // Typosquatting = +50
  if (riscos.hostInterno) score += 60;          // Host interno = +60
  
  // Ameaças moderadas (30 pontos)
  if (riscos.encurtador) score += 30;           // URL encurtada = +30 (não 100%)
  if (riscos.tldSuspeito) score += 25;
  if (riscos.tldAltoRisco) score += Number(riscos.tldAltoRiscoPontos || 25);
  if (riscos.palavrasGolpeTarefa) score += 20;
  if (riscos.redirecionamentoSuspeito) score += 20;          // TLD suspeito = +25
  if (riscos.reputacaoDesconhecida) score += 20; // Reputação desconhecida = +20
  if (riscos.dominioRecente) score += 20;       // Domínio recente = +20
  if (riscos.whatsappSuspeito) score += 20;     // WhatsApp suspeito = +20
  
  // Ameaças leves (10-15 pontos)
  if (riscos.muitosHifens) score += 15;         // Muitos hífens = +15
  if (riscos.abuseIPDBScore) score += 15;       // IP com reputação ruim = +15
  if (riscos.muitosSubdominios) score += 12;    // Muitos subdomínios = +12
  if (riscos.urlLonga) score += 10;             // URL longa = +10
  if (riscos.dominioMuitoLongo) score += 10;    // Domínio muito longo = +10
  if (riscos.excessoNumeros) score += 8;        // Excesso de números = +8
  if (riscos.whatsapp) score += 5;              // Menção a WhatsApp = +5

  return Math.min(score, 100);
};

export const obterNivelRisco = (score: number) => {
  if (score <= 20) return "Baixo";
  if (score <= 50) return "Moderado";
  if (score <= 80) return "Alto";
  return "Crítico";
};

export const gerarExplicacao = (riscos: any) => {
  const motivos = [];

  // Se é domínio confiável
  if (riscos.trustedDomain) {
    motivos.push("✓ Domínio confiável reconhecido");
  }

  if (riscos.typosquatting) {
    motivos.push("Typosquatting detectado");
  }
  if (riscos.encurtador) {
    motivos.push("URL encurtada detectada");
  }
  if (riscos.urlLonga) {
    motivos.push("URL excessivamente longa");
  }
  if (riscos.excessoNumeros) {
    motivos.push("Excesso de números na URL");
  }
  if (riscos.muitosSubdominios) {
    motivos.push("Muitos subdomínios");
  }

  return motivos;
};

export const validarURLCompleta = (url: string) => {
  const trimmedUrl = url.trim();
  
  // Rejeitar strings vazias ou muito curtas
  if (trimmedUrl.length < 3) return false;
  
  // Rejeitar texto claramente inválido (sem pontos, apenas números, etc.)
  if (!trimmedUrl.includes('.')) return false;
  if (/^\d+$/.test(trimmedUrl)) return false; // Apenas números
  if (/\s/.test(trimmedUrl)) return false; // Contém espaços
  
  try {
    // Se já tem protocolo, validar normalmente
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      const urlObj = new URL(trimmedUrl);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    }
    
    // Se não tem protocolo, tentar adicionar https:// e validar
    const urlWithProtocol = `https://${trimmedUrl}`;
    const urlObj = new URL(urlWithProtocol);
    return true;
  } catch {
    return false;
  }
};

// Função para normalizar URL (adicionar protocolo se necessário)
export const normalizarURL = (url: string): string => {
  const trimmedUrl = url.trim();
  
  // Se já tem protocolo, retornar como está
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // Caso contrário, adicionar https://
  return `https://${trimmedUrl}`;
};

export const detectarPalavrasSuspeitas = (url: string) => {
  const palavrasGolpe = [
    "pix",
    "urgente",
    "premio",
    "seguranca",
    "verificacao",
    "bloqueado",
    "atualize",
    "senha",
    "confirmacao",
    "cadastro",
    "beneficio",
    "liberado",
    "acesso"
  ];

  return palavrasGolpe.filter(palavra =>
    url.toLowerCase().includes(palavra)
  );
};

// ===== MELHORIAS ADICIONAIS =====

// 1. Detectar se é um endereço IP
export const isIPAddress = (hostname: string) => {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
};

// 2. Detectar host interno
export const detectarHostInterno = (hostname: string) => {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
};

// 3. Gerar explicação humana
export const gerarExplicacaoHumana = (riscos: any): string[] => {
  if (riscos.trustedDomain) {
    return ["Este é um domínio confiável e reconhecido. A análise foi realizada com sucesso."];
  }

  const explicacoes: string[] = [];
  if (riscos.typosquatting) explicacoes.push("O domínio pode estar tentando imitar uma marca conhecida (typosquatting).");
  if (riscos.encurtador) explicacoes.push("URL encurtada detectada; o destino real não fica visível.");
  if (riscos.hostInterno) explicacoes.push("Host interno ou local detectado.");
  if (riscos.tldSuspeito || riscos.tldAltoRisco) explicacoes.push("TLD suspeito frequentemente usado em golpes.");
  if (riscos.urlLonga) explicacoes.push("URL excessivamente longa.");
  if (riscos.excessoNumeros) explicacoes.push("Excesso de números na URL.");
  if (riscos.muitosSubdominios) explicacoes.push("Muitos níveis de subdomínios.");
  return explicacoes;
};

// 4. Obter cor de risco
export const obterCorRisco = (nivelRisco: string) => {
  switch (nivelRisco) {
    case "Baixo":
      return "green";
    case "Médio":
      return "yellow";
    case "Alto":
      return "red";
    default:
      return "gray";
  }
};

// 5. Muitos hífens
export const muitosHifens = (url: string) => {
  const hifens = url.match(/-/g);
  return Boolean(hifens && hifens.length >= 3);
};

// 6. Detectar TLD suspeito
export const detectarTLDSuspeito = (hostname: string) => {
  const tldsSuspeitos = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".click", ".shop", ".monster", ".sbs", ".zip", ".mov"];
  const host = hostname.toLowerCase();
  return tldsSuspeitos.some(tld => host.endsWith(tld));
};

// 6b. Detectar TLD de alto risco (frequentemente usado em phishing/golpes)
export const detectarTLDAltoRisco = (hostname: string): { isAltoRisco: boolean; pontos: number } => {
  const tldsAltoRisco: { [key: string]: number } = {
    ".sbs": 25,      // Frequentemente usado em phishing
    ".top": 20,      // Domínios baratos e suspeitos
    ".xyz": 18,      // Genérico, frequente em golpes
    ".click": 22,    // Redirecionamentos suspeitos
    ".live": 20,     // Streaming falso, golpes
    ".monster": 20,  // Empregos falsos
    ".shop": 15,     // E-commerce falso
    ".site": 15,     // Genérico, fácil de usar
    ".buzz": 18,     // Conteúdo viral falso
    ".cam": 22,      // Webcam/conteúdo adulto falso
    ".cc": 18,       // Genérico, usado em golpes
    ".tk": 25,       // Gratuito, muito usado em phishing
    ".ml": 25,       // Gratuito, muito usado em phishing
    ".ga": 25,       // Gratuito, muito usado em phishing
    ".cf": 25,       // Gratuito, muito usado em phishing
    ".gq": 25,       // Gratuito, muito usado em phishing
    ".work": 15,     // Empregos falsos
    ".online": 15,   // Genérico, frequente em golpes
    ".store": 15,    // Loja falsa
    ".download": 20, // Malware/conteúdo falso
    ".stream": 20,   // Streaming falso
    ".trade": 18,    // Investimentos falsos
    ".loan": 22,     // Empréstimos falsos
    ".bid": 20,      // Leilões falsos
  };

  for (const [tld, pontos] of Object.entries(tldsAltoRisco)) {
    if (hostname.endsWith(tld)) {
      return { isAltoRisco: true, pontos };
    }
  }

  return { isAltoRisco: false, pontos: 0 };
};

// 7. Gerar resumo baseado em classificacao final
export const gerarResumo = (classificacaoFinal: string | number, isTrusted: boolean = false, riscos: any = {}) => {
  let score: number | null = null;
  if (typeof classificacaoFinal === "number") {
    score = classificacaoFinal;
    classificacaoFinal = classificacaoFinal >= 70 ? "Alto" : classificacaoFinal >= 40 ? "Moderado" : "Baixo";
  }
  const normalizado = String(classificacaoFinal).toLowerCase();
  if (normalizado.includes("baixo")) {
    return isTrusted
      ? "Baixo risco. Domínio confiável reconhecido. Nenhum sinal crítico detectado."
      : "Baixo risco. O domínio aparenta ser seguro.";
  }
  if (normalizado.includes("moderado") || normalizado.includes("médio") || normalizado.includes("medio")) {
    if (riscos.typosquatting) {
      return "Risco moderado. O domínio apresenta características suspeitas compatíveis com typosquatting e pode estar tentando imitar uma marca conhecida.";
    }
    return "Risco moderado. Foram encontradas características suspeitas que merecem atenção.";
  }
  if (normalizado.includes("alto") || normalizado.includes("crit")) {
    return "Alto risco. Possível phishing ou ameaça detectada. Recomenda-se não acessar nem fornecer informações pessoais.";
  }
  return "Análise indisponível.";
};

// Funcao para gerar indicadores positivos de confianca
export const gerarIndicadoresPositivos = (riscos: any, url: string) => {
  const indicadores = [];

  try {
    const urlObj = new URL(url);

    // HTTPS valido
    if (urlObj.protocol === 'https:') {
      indicadores.push("✓ HTTPS valido");
    }

    // Certificado SSL ativo (assumir que HTTPS = SSL ativo)
    if (urlObj.protocol === 'https:') {
      indicadores.push("✓ Certificado SSL ativo");
    }

    // Dominio conhecido (whitelist)
    if (riscos.trustedDomain) {
      indicadores.push("✓ Dominio conhecido");
    }

    // Sem blacklist detectada
    if (!riscos.blacklist) {
      indicadores.push("✓ Sem blacklist detectada");
    }

    // Sem indicadores de phishing
    if (!riscos.typosquatting && !riscos.whatsappSuspeito && !riscos.tldSuspeito) {
      indicadores.push("✓ Sem indicadores de phishing");
    }

    // Reputacao positiva (dominio confiavel + sem riscos)
    if (riscos.trustedDomain && !riscos.blacklist && !riscos.typosquatting) {
      indicadores.push("✓ Reputacao positiva");
    }
  } catch (e) {
    // Ignorar erros de parsing de URL
  }

  return indicadores;
};


// ============================================
// EXPANSAO DE URLs ENCURTADAS
// ============================================

// Lista de encurtadores conhecidos (confiáveis)
export const KNOWN_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "lnkd.in",
  "rebrand.ly"
]);

// Funcao para expandir URL encurtada
export const expandirURLEncurtada = async (url: string): Promise<{ original: string; final: string | null; erro?: string }> => {
  try {
    // Se nao eh encurtador, retornar URL original
    if (!encurtadores.some(e => url.includes(e))) {
      return { original: url, final: null };
    }

    // Tentar resolver redirecionamento
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
      mode: 'no-cors'
    }).catch(() => null);

    if (!response) {
      // Se falhar, retornar URL original
      return { original: url, final: null, erro: "Nao foi possivel expandir URL" };
    }

    // Obter URL final apos redirecionamentos
    const urlFinal = response.url || url;
    return { original: url, final: urlFinal };
  } catch (e) {
    return { original: url, final: null, erro: "Erro ao expandir URL" };
  }
};

// Funcao para verificar se eh encurtador conhecido
export const ehEncurtadorConhecido = (url: string): boolean => {
  return Array.from(KNOWN_SHORTENERS).some(shortener => url.includes(shortener));
};


// ============================================
// DETECÇÃO DE PALAVRAS-CHAVE DE GOLPES DE TAREFAS
// ============================================

export const detectarPalavrasGolpeTarefa = (url: string): string[] => {
  const palavrasGolpe = [
    "bônus",
    "bonus",
    "comissão",
    "comissao",
    "renda extra",
    "ganhe dinheiro",
    "ganhar dinheiro",
    "youtube",
    "seguir canal",
    "whatsapp",
    "telegram",
    "tarefa remunerada",
    "tarefa paga",
    "trabalho remoto",
    "ganha",
    "ganhar",
    "lucro",
    "lucros",
    "investimento",
    "investimentos",
    "rendimento",
    "rendimentos",
    "juros",
    "taxa",
    "taxa de rendimento",
    "aplicativo",
    "app",
    "download app",
    "clique aqui",
    "toque aqui",
    "urgente",
    "ação rápida",
    "tempo limitado",
    "oferta limitada",
    "promoção",
    "cupom",
    "desconto",
    "frete grátis",
    "grátis",
    "gratuito"
  ];

  const urlLower = url.toLowerCase().replace(/[\-_]+/g, " ");
  return palavrasGolpe.filter(palavra => urlLower.includes(palavra));
};

// ============================================
// DETECÇÃO DE REDIRECIONAMENTOS SUSPEITOS
// ============================================

export const detectarRedirecionamentoSuspeito = (url: string): boolean => {
  const redirecionamentosSuspeitos = [
    "whatsapp.com/send",
    "wa.me",
    "telegram.me",
    "t.me",
    "tiktok.com",
    "youtube.com",
    "instagram.com",
    "facebook.com",
    "discord.gg",
    "discord.com/invite",
    "investimento",
    "investimentos",
    "grupo de investimento",
    "grupo privado",
    "grupo exclusivo",
    "comunidade vip",
    "comunidade premium",
    "acesso vip",
    "acesso premium",
    "acesso exclusivo",
    "bet365",
    "betano",
    "sportingbet",
    "1xbet",
    "aposta",
    "apostas",
    "cassino",
    "jogo",
    "jogos",
    "sorteio",
    "sorteios",
    "prêmio",
    "prêmios",
    "loteria",
    "loterias"
  ];

  const urlLower = url.toLowerCase();
  return redirecionamentosSuspeitos.some(redirecionamento => urlLower.includes(redirecionamento));
};

// ============================================
// DETECÇÃO DE IDADE DO DOMÍNIO (HEURÍSTICA)
// ============================================

export const detectarDominioRecente = (hostname: string): boolean => {
  // Esta é uma heurística básica
  // Em produção, seria necessário integrar com WHOIS API
  
  // Padrões comuns em domínios recentes:
  // - Números aleatórios
  // - Caracteres repetidos
  // - Estrutura incomum
  
  const padronsRecentes = [
    /\d{6,}/, // Muitos números seguidos
    /(.)\1{3,}/, // Caracteres repetidos (ex: aaaa)
    /^[a-z0-9]{4,6}$/, // Domínio muito curto com números
  ];

  return padronsRecentes.some(padrao => padrao.test(hostname));
};

// ============================================
// NOVA ESCALA DE RISCO (0-100)
// ============================================

export const obterNivelRiscoNovo = (score: number): "Baixo" | "Moderado" | "Alto" | "Crítico" => {
  // Nova escala conforme solicitado
  if (score <= 20) return "Baixo";
  if (score <= 50) return "Moderado";
  if (score <= 80) return "Alto";
  return "Crítico";
};

// ============================================
// CLASSIFICAÇÃO DE REPUTAÇÃO
// ============================================

export const obterClassificacaoReputacao = (riscos: any, score: number): string => {
  // Se o domínio é confiável e score baixo
  if (riscos.trustedDomain && score <= 20) {
    return "Reputação Positiva";
  }

  // Se há evidências externas de malware
  if (riscos.blacklist || riscos.virusTotalMalicious || riscos.urlhausMalware) {
    return "Reputação Negativa";
  }

  // Se não há dados suficientes
  if (!riscos.trustedDomain && score <= 50) {
    return "Reputação Desconhecida";
  }

  // Se há indicadores de risco
  if (score > 50) {
    return "Reputação Suspeita";
  }

  return "Reputação Desconhecida";
};



// ============================================
// DETECÇÃO DE ÓRGÃOS PÚBLICOS E DOMÍNIOS OFICIAIS
// ============================================

export const orgaosPublicos = {
  "receita federal": {
    nomes: ["receita", "receita federal", "receita.economia.gov.br"],
    dominiosOficiais: ["receita.economia.gov.br", "gov.br", "economia.gov.br"],
    palavrasChave: ["receita", "imposto de renda", "declaração", "cpf", "cnpj", "pendência cadastral"],
    indicadores: ["urgência", "restrição", "bloqueio", "multa", "débito", "pendência"],
  },
  "gov.br": {
    nomes: ["gov.br", "governo", "governo federal"],
    dominiosOficiais: ["gov.br"],
    palavrasChave: ["governo", "federal", "oficial"],
    indicadores: ["urgência", "ação imediata", "restrição"],
  },
  "inss": {
    nomes: ["inss", "instituto nacional de seguridade social"],
    dominiosOficiais: ["inss.gov.br", "gov.br"],
    palavrasChave: ["inss", "benefício", "aposentadoria", "auxílio", "pensão"],
    indicadores: ["urgência", "suspensão", "bloqueio", "pendência"],
  },
  "banco central": {
    nomes: ["banco central", "bacen", "bc"],
    dominiosOficiais: ["bcb.gov.br", "gov.br"],
    palavrasChave: ["banco central", "bacen", "pix", "transferência", "conta"],
    indicadores: ["urgência", "bloqueio", "restrição", "segurança"],
  },
  "correios": {
    nomes: ["correios", "correios brasil"],
    dominiosOficiais: ["correios.com.br"],
    palavrasChave: ["correios", "encomenda", "pacote", "entrega", "rastreamento"],
    indicadores: ["urgência", "retirada", "taxa", "pagamento"],
  },
  "justiça": {
    nomes: ["justiça", "tribunal", "juizado", "stf", "stj"],
    dominiosOficiais: ["jus.br", "gov.br", "stf.jus.br", "stj.jus.br"],
    palavrasChave: ["justiça", "tribunal", "processo", "ação judicial", "mandado"],
    indicadores: ["urgência", "comparecimento", "multa", "prisão", "bloqueio"],
  },
  "caixa econômica": {
    nomes: ["caixa", "caixa econômica", "caixa federal"],
    dominiosOficiais: ["caixa.gov.br", "gov.br"],
    palavrasChave: ["caixa", "fgts", "pis", "auxílio", "saque"],
    indicadores: ["urgência", "liberação", "saque", "bloqueio"],
  },
  "banco do brasil": {
    nomes: ["banco do brasil", "bb"],
    dominiosOficiais: ["bb.com.br"],
    palavrasChave: ["banco do brasil", "conta", "empréstimo", "cartão"],
    indicadores: ["urgência", "bloqueio", "restrição", "segurança"],
  },
};

export const detectarOrgaoPublico = (mensagem: string): string | null => {
  const mensagemLower = mensagem.toLowerCase();

  for (const [key, orgao] of Object.entries(orgaosPublicos)) {
    for (const nome of orgao.nomes) {
      if (mensagemLower.includes(nome)) {
        return key;
      }
    }
  }

  return null;
};

export const verificarDominioOficial = (url: string, orgaoKey: string): boolean => {
  const orgao = orgaosPublicos[orgaoKey as keyof typeof orgaosPublicos];
  if (!orgao) return false;

  const urlLower = url.toLowerCase();

  for (const dominio of orgao.dominiosOficiais) {
    if (urlLower.includes(dominio)) {
      return true;
    }
  }

  return false;
};

export const detectarIndicadoresOrgaoPublico = (mensagem: string, orgaoKey: string): string[] => {
  const orgao = orgaosPublicos[orgaoKey as keyof typeof orgaosPublicos];
  if (!orgao) return [];

  const mensagemLower = mensagem.toLowerCase();
  const indicadores: string[] = [];

  for (const indicador of orgao.indicadores) {
    if (mensagemLower.includes(indicador)) {
      indicadores.push(indicador);
    }
  }

  return indicadores;
};

export const detectarGolpeOrgaoPublico = (
  mensagem: string,
  url: string
): {
  ehGolpe: boolean;
  orgao: string | null;
  motivos: string[];
  risco: "CRÍTICO" | "ALTO" | "MODERADO" | null;
} => {
  const orgaoDetectado = detectarOrgaoPublico(mensagem);

  if (!orgaoDetectado) {
    return { ehGolpe: false, orgao: null, motivos: [], risco: null };
  }

  const ehOficial = verificarDominioOficial(url, orgaoDetectado);
  const indicadores = detectarIndicadoresOrgaoPublico(mensagem, orgaoDetectado);

  const motivos: string[] = [];
  let risco: "CRÍTICO" | "ALTO" | "MODERADO" = "MODERADO";

  if (!ehOficial) {
    motivos.push("Uso indevido de órgão público");
    motivos.push("Link externo não oficial");
    risco = "ALTO";

    // Verificar se há indicadores de urgência
    if (indicadores.length > 0) {
      motivos.push(`Urgência ou ameaça de ${indicadores.join(", ")}`);
      risco = "CRÍTICO";
    }

    // Verificar se o domínio é de alto risco
    const tldAltoRiscoResult = detectarTLDAltoRisco(new URL(url).hostname);
    if (tldAltoRiscoResult.isAltoRisco) {
      motivos.push(`TLD suspeito (.${new URL(url).hostname.split(".").pop()})`);
      risco = "CRÍTICO";
    }
  }

  return {
    ehGolpe: !ehOficial,
    orgao: orgaoDetectado,
    motivos,
    risco: !ehOficial ? risco : null,
  };
};

export const gerarMensagemGolpeOrgaoPublico = (
  mensagem: string,
  url: string,
  resultado: ReturnType<typeof detectarGolpeOrgaoPublico>
): string => {
  if (!resultado.ehGolpe) {
    return "";
  }

  const orgao = orgaosPublicos[resultado.orgao as keyof typeof orgaosPublicos];
  const nomeOrgao = orgao?.nomes[0] || resultado.orgao;

  return `Esta mensagem aparenta ser golpe. Ela usa o nome da ${nomeOrgao} para criar urgência e direciona o usuário para um domínio que não pertence aos canais oficiais do governo. ${resultado.motivos.length > 0 ? `Indicadores: ${resultado.motivos.join(", ")}.` : ""} NÃO CLIQUE no link.`;
};


// ============================================
// RISCO COMPORTAMENTAL - NOVA CAMADA
// ============================================

/**
 * Detectar URL curta com códigos suspeitos
 * Exemplo: /pr12, /id123, /r45, /go, /click
 */
export const detectarURLCurtaSuspeita = (url: string): boolean => {
  const padroesCurtos = [
    /\/[a-z]{1,2}\d{1,3}(?:[/?#]|$)/i,  // /pr12, /id123, /r45
    /\/(?:go|click|link|ref|track|ad|utm)(?:[/?#]|$)/i,  // /go, /click, /link
    /\/[a-z0-9]{2,4}(?:[/?#]|$)/i,  // Códigos curtos genéricos
  ];

  return padroesCurtos.some(padrao => padrao.test(url));
};

/**
 * Detectar se o domínio é marca conhecida
 */
export const ehMarcaConhecida = (hostname: string): boolean => {
  const marcasConhecidas = [
    'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'instagram',
    'whatsapp', 'telegram', 'twitter', 'linkedin', 'github', 'gitlab',
    'dropbox', 'onedrive', 'icloud', 'gmail', 'outlook', 'hotmail',
    'youtube', 'reddit', 'wikipedia', 'stackoverflow', 'slack', 'notion',
    'figma', 'zoom', 'stripe', 'paypal', 'adobe', 'autodesk',
    'bb', 'itau', 'bradesco', 'caixa', 'nubank', 'santander',
    'gov', 'receita', 'inss', 'correios', 'banco'
  ];

  const normalizado = hostname.toLowerCase();
  return marcasConhecidas.some(marca => 
    normalizado.includes(marca) && 
    (normalizado.includes('.com') || normalizado.includes('.gov') || normalizado.includes('.br'))
  );
};

/**
 * Calcular score de risco comportamental
 * Não considera HTTPS/SSL como fator de confiança
 */
export const calcularRiscoComportamental = (url: string, contexto?: string): number => {
  let score = 0;
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    const fullUrl = urlObj.toString();

    // 1. TLD DE ALTO RISCO (+25 pontos)
    const tldsAltoRisco = ['.sbs', '.top', '.xyz', '.click', '.live', '.cam', '.cc', '.site', '.shop', '.buzz'];
    const tld = hostname.substring(hostname.lastIndexOf('.'));
    if (tldsAltoRisco.includes(tld)) {
      score += 25;
    }

    // 2. DOMÍNIO RECÉM-CRIADO OU REPUTAÇÃO DESCONHECIDA (+20 pontos)
    // Se não é marca conhecida e não está em whitelist
    if (!ehMarcaConhecida(hostname) && !TRUSTED_DOMAINS_WHITELIST.has(hostname)) {
      score += 20;
    }

    // 3. DOMÍNIO NÃO É MARCA CONHECIDA (+10 pontos)
    if (!ehMarcaConhecida(hostname)) {
      score += 10;
    }

    // 4. URL CURTA COM CÓDIGOS SUSPEITOS (+10 pontos)
    if (detectarURLCurtaSuspeita(pathname)) {
      score += 10;
    }

    // 5. CONTEXTO DE ÓRGÃO PÚBLICO (+50 pontos)
    // Verificar se a URL é de órgão público oficial
    if (contexto) {
      const contextoLower = contexto.toLowerCase();
      const orgaosPublicos = ['receita', 'inss', 'gov.br', 'correios', 'banco central', 'caixa'];
      const ehOrgaoPublico = orgaosPublicos.some(orgao => contextoLower.includes(orgao));
      
      if (ehOrgaoPublico) {
        // Se menciona órgão público mas não é domínio oficial
        const dominiosOficiais = ['gov.br', 'receita.economia.gov.br', 'inss.gov.br', 'correios.com.br', 'bcb.gov.br', 'caixa.gov.br'];
        const ehDominioOficial = dominiosOficiais.some(dominio => hostname.includes(dominio));
        
        if (!ehDominioOficial) {
          score += 50;
        }
      }
    }

    return Math.min(score, 100);
  } catch {
    return 0;
  }
};

/**
 * Classificar risco com nova escala
 */
export const classificarRiscoComportamental = (score: number): string => {
  if (score <= 20) return "Baixo";
  if (score <= 50) return "Moderado";
  if (score <= 75) return "Alto";
  return "Crítico";
};

/**
 * Gerar mensagem obrigatória sobre ausência de blacklist
 */
export const gerarMensagemAusenciaBlacklist = (score: number): string => {
  if (score >= 25) {
    return "Ausência de blacklist não significa segurança. O domínio apresenta características frequentemente utilizadas em campanhas de phishing e engenharia social.";
  }
  return "";
};
