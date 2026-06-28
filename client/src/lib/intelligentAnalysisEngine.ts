/**
 * Motor de Análise Inteligente
 * Diferencia reputação, contexto, heurística
 * Reduz falsos positivos em domínios confiáveis
 */

import { ehDominioConfiavel } from "./trustedDomains";
import { calcularScoreInteligente } from "./intelligentScoring";

export interface AnaliseProfunda {
  scoreTotal: number;
  temCaracteristicasSuspeitas: boolean;
  contextoAnalise: {
    dominioConfiavel: boolean;
    urlLonga: boolean;
    muitosParametros: boolean;
    temToken: boolean;
    ehEncurtada: boolean;
    muitosSubdominios: boolean;
  };
  fatoresCriticos: string[]; // Fatores que elevam o risco
  fatoresPositivos: string[]; // Fatores que reduzem o risco
  recomendacao: string;
}

/**
 * Análise profunda com contexto
 */
export function analisarComContexto(
  url: string,
  hostname: string,
  scoreTotal: number,
  componentes: any[]
): AnaliseProfunda {
  const urlObj = new URL(url);
  const ehConfiavel = ehDominioConfiavel(hostname);
  const urlLonga = url.length > 120;
  const muitosParametros = urlObj.searchParams.size > 3;
  const temToken = /token|key|auth|session|id=[a-f0-9]{20,}|code=[a-f0-9]{20,}/.test(url.toLowerCase());
  const ehEncurtada = /bit\.ly|tinyurl|t\.co|goo\.gl|cutt\.ly|shorturl|ow\.ly|is\.gd|buff\.ly|adf\.ly/.test(hostname);
  const muitosSubdominios = (hostname.match(/\./g) || []).length > 3;

  const contexto = {
    dominioConfiavel: ehConfiavel,
    urlLonga,
    muitosParametros,
    temToken,
    ehEncurtada,
    muitosSubdominios
  };

  // Fatores que elevam o risco
  const fatoresCriticos: string[] = [];
  if (ehEncurtada) fatoresCriticos.push("URL encurtada (dificulta verificação)");
  if (muitosSubdominios) fatoresCriticos.push("Muitos níveis de subdomínios");
  if (temToken && !ehConfiavel) fatoresCriticos.push("Token/chave em domínio desconhecido");
  if (muitosParametros && !ehConfiavel) fatoresCriticos.push("Muitos parâmetros em domínio desconhecido");

  // Fatores que reduzem o risco
  const fatoresPositivos: string[] = [];
  if (ehConfiavel) fatoresPositivos.push("Domínio corporativo conhecido");
  if (urlObj.protocol === "https:") fatoresPositivos.push("Conexão criptografada (HTTPS)");
  if (!urlLonga) fatoresPositivos.push("Comprimento de URL normal");
  if (!muitosParametros) fatoresPositivos.push("Poucos parâmetros");

  // Determinar se há características suspeitas
  const temCaracteristicasSuspeitas = scoreTotal > 20;

  // Gerar recomendação contextualizada
  let recomendacao = "";
  if (ehConfiavel && temCaracteristicasSuspeitas) {
    recomendacao = "Este link usa um domínio legítimo, mas tem características incomuns. Verifique a origem antes de clicar.";
  } else if (!ehConfiavel && temCaracteristicasSuspeitas) {
    recomendacao = "Tenha cuidado com este link. Apresenta características estruturais incomuns. Se recebeu por WhatsApp, confirme com a pessoa por ligação antes de clicar.";
  } else if (ehConfiavel && !temCaracteristicasSuspeitas) {
    recomendacao = "Você pode acessar este link com confiança. Mesmo assim, mantenha-se atento a phishing.";
  } else {
    recomendacao = "Este link não apresenta características suspeitas detectáveis. Sempre verifique a origem antes de clicar.";
  }

  return {
    scoreTotal,
    temCaracteristicasSuspeitas,
    contextoAnalise: contexto,
    fatoresCriticos,
    fatoresPositivos,
    recomendacao
  };
}

/**
 * Calcula confiança da análise (0-100)
 * Baseado em quantos fatores foram analisados
 */
export function calcularConfiancaAnalise(
  googleDetected: boolean,
  temCaracteristicasSuspeitas: boolean,
  scoreTotal: number
): number {
  let confianca = 60; // Base

  if (googleDetected) {
    confianca = 100; // Google Safe Browsing = 100% confiança
  } else if (temCaracteristicasSuspeitas) {
    confianca = 75; // Heurística detectou padrões = 75%
  } else {
    confianca = 85; // Sem características suspeitas = 85%
  }

  return confianca;
}

/**
 * Gera sumário profissional da análise
 */
export function gerarSumarioAnalise(
  url: string,
  hostname: string,
  scoreTotal: number,
  googleDetected: boolean,
  ameacasGoogle?: string[]
): string {
  const ehConfiavel = ehDominioConfiavel(hostname);
  const confianca = calcularConfiancaAnalise(googleDetected, scoreTotal > 20, scoreTotal);

  let sumario = `**Análise de Segurança**\n\n`;
  sumario += `**Score:** ${scoreTotal}/100\n`;
  sumario += `**Confiança:** ${confianca}%\n`;
  sumario += `**Fonte:** ${googleDetected ? "Google Safe Browsing" : "Análise Heurística"}\n\n`;

  if (googleDetected && ameacasGoogle) {
    sumario += `**Ameaças Detectadas:** ${ameacasGoogle.join(", ")}\n`;
  }

  if (ehConfiavel) {
    sumario += `**Domínio:** Corporativo conhecido\n`;
  } else {
    sumario += `**Domínio:** Desconhecido\n`;
  }

  return sumario;
}
