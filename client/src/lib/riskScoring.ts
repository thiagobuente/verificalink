/**
 * Sistema de Scoring de Risco Profissional
 * Diferencia: Seguro, Suspeito e Alto Risco
 * Evita falsos positivos com domínios confiáveis
 */

import { ehDominioConfiavel, deveIgnorarCaracteristicaSuspeita } from "./trustedDomains";

export type NivelRisco = "Seguro" | "Suspeito" | "Alto Risco";

export type TipoMotivo = "positivo" | "suspeito" | "critico";

export interface Motivo {
  tipo: TipoMotivo; // positivo (✔), suspeito (⚠), critico (❌)
  texto: string;
  detalhes?: string;
}

export interface ResultadoAnalise {
  nivelRisco: NivelRisco;
  score: number; // 0-100
  classificacao: string; // Ex: "Seguro", "Suspeito estruturalmente", "Alto Risco - Padrão de Phishing"
  motivos: Motivo[]; // Categorizados
  recomendacoes: string[];
  ehDominioConfiavel: boolean;
  ehAmeacaConfirmada: boolean; // Diferencia heurística de ameaça real
  analiseDetalhada: {
    typosquatting: boolean;
    encurtador: boolean;
    dominioRecente: boolean;
    urlLonga: boolean;
    muitosSubdominios: boolean;
    excessoNumeros: boolean;
    hostInterno: boolean;
    tldSuspeito: boolean;
    palavrasSuspeitas: string[];
  };
}

/**
 * Calcula score de risco profissional
 * Considera reputação do domínio + heurísticas
 */
export function calcularScoreProfissional(
  hostname: string,
  analiseHeuristica: {
    typosquatting: boolean;
    encurtador: boolean;
    dominioRecente: boolean;
    urlLonga: boolean;
    muitosSubdominios: boolean;
    excessoNumeros: boolean;
    hostInterno: boolean;
    tldSuspeito: boolean;
    palavrasSuspeitas: string[];
  }
): number {
  let score = 0;
  const ehConfiavel = ehDominioConfiavel(hostname);
  const temSinais = Object.entries(analiseHeuristica).some(([k, v]) => k === "palavrasSuspeitas" ? Array.isArray(v) && v.length > 0 : Boolean(v));
  if (!ehConfiavel && temSinais) score += 15;

  // FATORES CRÍTICOS (Alto risco)
  if (analiseHeuristica.typosquatting) score += 35;
  if (analiseHeuristica.encurtador) score += 30;
  if (analiseHeuristica.hostInterno) score += 50;
  if (analiseHeuristica.tldSuspeito) score += 25;

  // FATORES SECUNDÁRIOS (Médio risco)
  if (analiseHeuristica.dominioRecente) score += 15;
  if (analiseHeuristica.palavrasSuspeitas.length > 0) {
    score += Math.min(analiseHeuristica.palavrasSuspeitas.length * 8, 20);
  }

  // FATORES LEVES (Baixo risco) - IGNORADOS EM DOMÍNIOS CONFIÁVEIS
  if (!ehConfiavel) {
    if (analiseHeuristica.urlLonga) score += 8;
    if (analiseHeuristica.muitosSubdominios) score += 10;
    if (analiseHeuristica.excessoNumeros) score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Determina o nível de risco baseado no score
 */
export function obterNivelRiscoProfissional(
  score: number,
  ehConfiavel: boolean,
  temFatoresCriticos: boolean
): NivelRisco {
  if (temFatoresCriticos) {
    return "Alto Risco";
  }

  if (ehConfiavel && score < 20) {
    return "Seguro";
  }

  if (score <= 25) return "Seguro";
  if (score <= 60) return "Suspeito";
  return "Alto Risco";
}

/**
 * Gera classificação profissional (diferencia heurística de ameaça confirmada)
 */
export function gerarClassificacao(
  nivelRisco: NivelRisco,
  temFatoresCriticos: boolean,
  ehDominioConfiavel: boolean
): string {
  if (ehDominioConfiavel && nivelRisco === "Seguro") {
    return "✔ Seguro - Domínio confiável";
  }

  if (nivelRisco === "Seguro") {
    return "✔ Seguro";
  }

  if (nivelRisco === "Suspeito") {
    if (temFatoresCriticos) {
      return "⚠ Alto Risco - Padrão de Phishing";
    }
    return "⚠ Suspeito estruturalmente";
  }

  if (temFatoresCriticos) {
    return "❌ Alto Risco - Ameaça confirmada";
  }

  return "❌ Alto Risco";
}

/**
 * Gera motivos categorizados para o resultado
 */
export function gerarMotivos(analise: {
  analiseDetalhada: {
    typosquatting: boolean;
    encurtador: boolean;
    dominioRecente: boolean;
    urlLonga: boolean;
    muitosSubdominios: boolean;
    excessoNumeros: boolean;
    hostInterno: boolean;
    tldSuspeito: boolean;
    palavrasSuspeitas: string[];
  };
  ehDominioConfiavel: boolean;
}): Motivo[] {
  const motivos: Motivo[] = [];

  // FATORES CRÍTICOS (❌)
  if (analise.analiseDetalhada.typosquatting) {
    motivos.push({
      tipo: "critico",
      texto: "Typosquatting detectado",
      detalhes: "Domínio imita marca conhecida com pequenas variações"
    });
  }

  if (analise.analiseDetalhada.encurtador) {
    motivos.push({
      tipo: "critico",
      texto: "URL encurtada",
      detalhes: "Destino real não é visível - padrão comum em phishing"
    });
  }

  if (analise.analiseDetalhada.hostInterno) {
    motivos.push({
      tipo: "critico",
      texto: "Host interno detectado",
      detalhes: "Possível ataque SSRF ou acesso restrito"
    });
  }

  if (analise.analiseDetalhada.tldSuspeito) {
    motivos.push({
      tipo: "critico",
      texto: "TLD suspeito",
      detalhes: "Extensão de domínio frequentemente usada em golpes"
    });
  }

  // FATORES SUSPEITOS (⚠)
  if (analise.analiseDetalhada.dominioRecente) {
    motivos.push({
      tipo: "suspeito",
      texto: "Domínio recém-criado",
      detalhes: "Histórico desconhecido - pode ser novo ou malicioso"
    });
  }

  if (analise.analiseDetalhada.urlLonga) {
    motivos.push({
      tipo: "suspeito",
      texto: "URL excessivamente longa",
      detalhes: "Pode ocultar informações ou parâmetros suspeitos"
    });
  }

  if (analise.analiseDetalhada.muitosSubdominios) {
    motivos.push({
      tipo: "suspeito",
      texto: "Muitos subdomínios",
      detalhes: "Estrutura incomum - pode indicar redirecionamento"
    });
  }

  if (analise.analiseDetalhada.excessoNumeros) {
    motivos.push({
      tipo: "suspeito",
      texto: "Excesso de números",
      detalhes: "Padrão suspeito em URLs de phishing"
    });
  }

  if (analise.analiseDetalhada.palavrasSuspeitas.length > 0) {
    motivos.push({
      tipo: "suspeito",
      texto: `Palavras suspeitas: ${analise.analiseDetalhada.palavrasSuspeitas.join(", ")}`,
      detalhes: "Termos comuns em tentativas de phishing"
    });
  }

  // FATORES POSITIVOS (✔)
  if (analise.ehDominioConfiavel) {
    motivos.push({
      tipo: "positivo",
      texto: "Domínio confiável",
      detalhes: "Empresa ou serviço estabelecido com boa reputação"
    });
  }

  return motivos;
}

/**
 * Gera recomendações baseadas no nível de risco
 */
export function gerarRecomendacoes(nivelRisco: NivelRisco): string[] {
  switch (nivelRisco) {
    case "Seguro":
      return [
        "Este domínio possui boa reputação",
        "Você pode acessar com confiança",
        "Mantenha-se atento a phishing mesmo em sites seguros"
      ];

    case "Suspeito":
      return [
        "Este link possui características incomuns",
        "Verifique a origem antes de clicar",
        "Se recebeu por WhatsApp, confirme com a pessoa por ligação",
        "Não insira dados pessoais ou bancários"
      ];

    case "Alto Risco":
      return [
        "⚠️ Este link apresenta padrões de phishing",
        "❌ NÃO clique neste link",
        "❌ NÃO insira dados pessoais ou bancários",
        "Se recebeu por WhatsApp, é provável que seja golpe",
        "Confirme com a pessoa por ligação antes de qualquer ação"
      ];
  }
}

/**
 * Função principal de análise
 */
export function analisarRiscoURL(
  url: string,
  analiseHeuristica: {
    typosquatting: boolean;
    encurtador: boolean;
    dominioRecente: boolean;
    urlLonga: boolean;
    muitosSubdominios: boolean;
    excessoNumeros: boolean;
    hostInterno: boolean;
    tldSuspeito: boolean;
    palavrasSuspeitas: string[];
  }
): ResultadoAnalise {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const ehConfiavel = ehDominioConfiavel(hostname);

    // Verifica se há fatores críticos
    const temFatoresCriticos =
      analiseHeuristica.typosquatting ||
      analiseHeuristica.encurtador ||
      analiseHeuristica.hostInterno ||
      analiseHeuristica.tldSuspeito;

    const score = calcularScoreProfissional(hostname, analiseHeuristica);
    const nivelRisco = obterNivelRiscoProfissional(score, ehConfiavel, temFatoresCriticos);
    const classificacao = gerarClassificacao(nivelRisco, temFatoresCriticos, ehConfiavel);
    const motivosList = gerarMotivos({ analiseDetalhada: analiseHeuristica, ehDominioConfiavel: ehConfiavel });
    const recomendacoes = gerarRecomendacoes(nivelRisco);

    // Ameaça confirmada = fatores críticos + score alto
    const ehAmeacaConfirmada = temFatoresCriticos && score >= 30;

    return {
      nivelRisco,
      score,
      classificacao,
      motivos: motivosList,
      recomendacoes,
      ehDominioConfiavel: ehConfiavel,
      ehAmeacaConfirmada,
      analiseDetalhada: analiseHeuristica
    };
  } catch (erro) {
    return {
      nivelRisco: "Alto Risco",
      score: 100,
      classificacao: "❌ URL inválida",
      motivos: [
        {
          tipo: "critico",
          texto: "URL inválida",
          detalhes: "Esta URL não é válida ou usa protocolo não permitido"
        }
      ],
      recomendacoes: ["Esta URL não é válida"],
      ehDominioConfiavel: false,
      ehAmeacaConfirmada: true,
      analiseDetalhada: {
        typosquatting: false,
        encurtador: false,
        dominioRecente: false,
        urlLonga: false,
        muitosSubdominios: false,
        excessoNumeros: false,
        hostInterno: false,
        tldSuspeito: false,
        palavrasSuspeitas: []
      }
    };
  }
}
