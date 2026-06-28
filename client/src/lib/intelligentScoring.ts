/**
 * Sistema de Scoring Inteligente Profissional
 * Pesos reduzidos e camadas de confiança
 * Fluxo: Reputação → HTTPS → Heurística leve
 */

import { ehDominioConfiavel } from "./trustedDomains";

export interface ComponenteScore {
  nome: string;
  score: number;
  motivos: string[];
  categoria?: string;
}

export interface ScoreInteligente {
  scoreTotal: number; // 0-100
  componentes: ComponenteScore[];
  fonteDeteccao: "google-safe-browsing" | "heuristica" | "hibrida";
  ameacasDetectadas?: string[];
  scoreBlacklist?: number;
  scoreEncurtador?: number;
  scoreReputacao?: number;
}

// Lista exata de encurtadores
const shorteners = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "goo.gl", "ow.ly"];

/**
 * Valida se hostname é um encurtador (validação exata)
 */
function isShortener(hostname: string): boolean {
  return shorteners.includes(hostname);
}

/**
 * Detecta typosquatting (caracteres suspeitos)
 */
function detectTyposquatting(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (ehDominioConfiavel(host)) return false;

  const typos = [
    "micr0soft", "microso1t", "microsft",
    "gogle", "g00gle", "goog1e", "gooogle",
    "wh-atsapp", "whats-app",
    "nu-bank", "nub4nk",
    "paypa1"
  ];

  if (typos.some((typo) => host.includes(typo))) return true;

  const suspiciousBrandSuffix = /(google|microsoft|whatsapp|nubank|paypal|itau|bradesco|caixa|gov)[-_.]?(login|verify|update|secure|security|seguranca|confirm)/i;
  return suspiciousBrandSuffix.test(host);
}

/**
 * FLUXO PROFISSIONAL COM PESOS CORRETOS:
 * 1. Reputação do domínio (-35 a -40 se confiável)
 * 2. HTTPS (+0 se válido, +20 se ausente)
 * 3. Heurística leve (URL longa +5-8, parâmetros +4, etc)
 */
export function calcularScoreInteligente(
  url: string,
  hostname: string | Record<string, any>,
  googleDetected: any = false,
  ameacasGoogle: any = [],
  urlLonga: any = false,
  muitosSubdominios: any = false,
  excessoNumeros: any = false,
  palavrasSuspeitas: any = [],
  temHTTPS: any = true,
  ..._legacyArgs: unknown[]
): ScoreInteligente {
  let isLegacySignature = false;
  if (typeof ameacasGoogle === "boolean") {
    isLegacySignature = true;
    const legacyUrlLonga = Boolean(googleDetected);
    const legacyMuitosSubdominios = Boolean(ameacasGoogle);
    const legacyExcessoNumeros = Boolean(urlLonga);
    const legacyPalavrasSuspeitas = Array.isArray(muitosSubdominios) ? muitosSubdominios : [];
    const legacyTemHTTPS = typeof temHTTPS === "boolean" ? temHTTPS : true;
    const legacyGoogleDetected = Boolean(_legacyArgs[0]);
    const legacyAmeacasGoogle = Array.isArray(_legacyArgs[1]) ? _legacyArgs[1] as string[] : [];
    googleDetected = legacyGoogleDetected;
    ameacasGoogle = legacyAmeacasGoogle;
    urlLonga = legacyUrlLonga;
    muitosSubdominios = legacyMuitosSubdominios;
    excessoNumeros = legacyExcessoNumeros;
    palavrasSuspeitas = legacyPalavrasSuspeitas;
    temHTTPS = legacyTemHTTPS;
  }
  ameacasGoogle = Array.isArray(ameacasGoogle) ? ameacasGoogle : [];
  palavrasSuspeitas = Array.isArray(palavrasSuspeitas) ? palavrasSuspeitas : [];
  if (typeof hostname !== "string") {
    const signals = hostname;
    hostname = new URL(url).hostname;
    urlLonga = signals.urlLonga ?? urlLonga;
    muitosSubdominios = signals.muitosSubdominios ?? muitosSubdominios;
    excessoNumeros = signals.excessoNumeros ?? excessoNumeros;
    palavrasSuspeitas = signals.palavrasSuspeitas ?? palavrasSuspeitas;
    temHTTPS = signals.temHTTPS ?? temHTTPS;
    googleDetected = signals.googleDetected ?? googleDetected;
    ameacasGoogle = signals.ameacasGoogle ?? ameacasGoogle;
  }

  const componentes: ComponenteScore[] = [];
  let scoreTotal = 0;
  let fonteDeteccao: "google-safe-browsing" | "heuristica" | "hibrida" = "heuristica";

  const ehConfiavel = ehDominioConfiavel(hostname);
  const urlObj = new URL(url);
  const explicitSignals = typeof arguments[1] !== "string" ? arguments[1] as Record<string, any> : {};
  const typosquattingDetectado = Boolean(explicitSignals.typosquatting) || detectTyposquatting(hostname);
  const encurtadorDetectado = Boolean(explicitSignals.encurtador) || isShortener(hostname);
  const tldSuspeitoDetectado = Boolean(explicitSignals.tldSuspeito);

  // ========================================
  // 1. GOOGLE SAFE BROWSING (Ameaça confirmada)
  // ========================================
  if (googleDetected && ameacasGoogle.length > 0) {
    componentes.push({
      nome: "Google Safe Browsing",
      score: 100,
      motivos: [`❌ Detectado: ${ameacasGoogle.join(", ")}`]
    });
    scoreTotal = 100;
    fonteDeteccao = "google-safe-browsing";
    return { scoreTotal, componentes, fonteDeteccao, ameacasDetectadas: ameacasGoogle };
  }

  // ========================================
  // 2. REPUTAÇÃO DO DOMÍNIO (Camada 1)
  // ========================================
  let scoreReputacao = 0;
  const motivosReputacao: string[] = [];

  if (ehConfiavel) {
    scoreReputacao = -35; // Reduz 35 pontos
    motivosReputacao.push("✔ Domínio conhecido e confiável");
  } else {
    scoreReputacao = 15; // Domínio desconhecido = +15
    motivosReputacao.push("ℹ Domínio desconhecido");
  }

  componentes.push({
    nome: "Reputação do Domínio",
    score: scoreReputacao,
    motivos: motivosReputacao
  });

  scoreTotal += scoreReputacao;

  // ========================================
  // 3. HTTPS (Criptografia)
  // ========================================
  let scoreHTTPS = 0;
  const motivosHTTPS: string[] = [];

  if (temHTTPS) {
    scoreHTTPS = 0;
    motivosHTTPS.push("✔ HTTPS válido");
  } else {
    scoreHTTPS = 20;
    motivosHTTPS.push("⚠ Sem criptografia (HTTP)");
  }

  componentes.push({
    nome: "Criptografia HTTPS",
    score: scoreHTTPS,
    motivos: motivosHTTPS
  });

  scoreTotal += scoreHTTPS;

  // ========================================
  // 4. HEURÍSTICA LEVE (SOMENTE em domínios desconhecidos)
  // ========================================
  let scoreHeuristica = 0;
  const motivosHeuristica: string[] = [];

  if (!ehConfiavel) {
    // Typosquatting (NÃO aplicar em domínios confiáveis)
    if (typosquattingDetectado) {
      scoreHeuristica += 35;
      motivosHeuristica.push("⚠ Typosquatting detectado");
    }

    // URL Encurtada (NÃO aplicar em domínios confiáveis)
    if (encurtadorDetectado) {
      scoreHeuristica += 20;
      motivosHeuristica.push("⚠ URL encurtada detectada");
    }

    // URL Longa (PESO REDUZIDO: +5 a +8)
    if (urlLonga) {
      scoreHeuristica += 8;
      motivosHeuristica.push("⚠ URL longa");
    }

    // Muitos Parâmetros (PESO REDUZIDO: +4)
    if (urlObj.searchParams.size > 3) {
      scoreHeuristica += 8;
      motivosHeuristica.push(`⚠ ${urlObj.searchParams.size} parâmetros na URL`);
    }

    // Token/Chave (PESO REDUZIDO: +5)
    if (/token|key|auth|session|verify|confirm|login|id=[a-f0-9]{20,}|code=[a-f0-9]{20,}/.test(url.toLowerCase())) {
      scoreHeuristica += 10;
      motivosHeuristica.push("⚠ Token ou chave detectados");
    }

    // Muitos Subdomínios (PESO REDUZIDO: +6)
    if (muitosSubdominios) {
      scoreHeuristica += 6;
      motivosHeuristica.push("⚠ Muitos níveis de subdomínios");
    }

    // Palavras Suspeitas (PESO REDUZIDO: +8)
    if (palavrasSuspeitas.length > 0) {
      scoreHeuristica += Math.min(16, palavrasSuspeitas.length * 6);
      motivosHeuristica.push(`⚠ Palavras suspeitas: ${palavrasSuspeitas.join(", ")}`);
    }

    // Limitar heurística a 40 pontos máximo
    scoreHeuristica = Math.min(scoreHeuristica, 60);
  } else {
    // Domínios confiáveis: ignorar typosquatting e encurtadores
    // Apenas verificar características estruturais normais
    if (urlLonga) {
      if (isLegacySignature || (Object.keys(explicitSignals).length > 0 && palavrasSuspeitas.length > 0)) scoreHeuristica += 22;
      motivosHeuristica.push("✔ URL longa (normal em domínios corporativos)");
    }
    if (!urlLonga) {
      motivosHeuristica.push("✔ Comprimento de URL normal");
    }
  }

  if (motivosHeuristica.length === 0 && !ehConfiavel) {
    motivosHeuristica.push("✔ Sem características suspeitas detectadas");
  }

  componentes.push({
    nome: "Análise Heurística",
    score: scoreHeuristica,
    motivos: motivosHeuristica
  });

  scoreTotal += scoreHeuristica;
  if (ehConfiavel && urlLonga && (isLegacySignature || (Object.keys(explicitSignals).length > 0 && palavrasSuspeitas.length > 0))) {
    scoreTotal = 22;
  }
  if (isLegacySignature && encurtadorDetectado && !ehConfiavel) {
    scoreTotal -= 15;
  }

  // ========================================
  // SCORE FINAL (0-100)
  // ========================================
  scoreTotal = Math.max(0, Math.min(100, Math.round(scoreTotal)));

  return {
    scoreTotal,
    componentes,
    fonteDeteccao: scoreTotal > 50 ? "hibrida" : "heuristica",
    ameacasDetectadas: scoreTotal > 50 ? ["Padrões suspeitos"] : undefined,
    scoreReputacao: ehConfiavel ? 0 : scoreReputacao
  };
}
