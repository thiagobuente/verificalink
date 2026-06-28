/**
 * Motor de Reputação Híbrido
 * Combina múltiplas fontes: Google Safe Browsing, heurística, whitelist, blacklist, contexto
 */

export interface ReputationSource {
  nome: string;
  status: "limpo" | "suspeito" | "malicioso" | "desconhecido";
  confianca: number; // 0-100
  motivo?: string;
}

export interface ReputationAnalysis {
  fontes: ReputationSource[];
  scoreGeral: number; // 0-100
  confiancaGeral: number; // 0-100
  resumo: string;
}

/**
 * Analisa reputação do domínio através de múltiplas fontes
 */
export async function analisarReputacao(
  hostname: string,
  url: string,
  googleSafeBrowsingResult?: { ameacas: string[] }
): Promise<ReputationAnalysis> {
  const fontes: ReputationSource[] = [];
  let scoreGeral = 0;
  let confiancaGeral = 0;

  // ========================================
  // 1. GOOGLE SAFE BROWSING
  // ========================================
  if (googleSafeBrowsingResult?.ameacas.length) {
    fontes.push({
      nome: "Google Safe Browsing",
      status: "malicioso",
      confianca: 95,
      motivo: `Detectado: ${googleSafeBrowsingResult.ameacas.join(", ")}`
    });
    scoreGeral += 95;
    confiancaGeral += 95;
  } else {
    fontes.push({
      nome: "Google Safe Browsing",
      status: "limpo",
      confianca: 90,
      motivo: "Não encontrado em banco de dados de malware"
    });
    confiancaGeral += 90;
  }

  // ========================================
  // 2. WHITELIST (Domínios confiáveis)
  // ========================================
  const dominiosConfiados = [
    "microsoft.com",
    "sharepoint.com",
    "office.com",
    "google.com",
    "drive.google.com",
    "github.com",
    "dropbox.com",
    "icloud.com"
  ];

  const ehConfiado = dominiosConfiados.some(d => hostname.endsWith(d));
  if (ehConfiado) {
    fontes.push({
      nome: "Whitelist",
      status: "limpo",
      confianca: 100,
      motivo: "Domínio em lista de confiança"
    });
    confiancaGeral += 100;
  } else {
    fontes.push({
      nome: "Whitelist",
      status: "desconhecido",
      confianca: 50,
      motivo: "Domínio não consta na whitelist"
    });
    confiancaGeral += 50;
  }

  // ========================================
  // 3. HTTPS (Criptografia)
  // ========================================
  const temHTTPS = url.startsWith("https://");
  if (temHTTPS) {
    fontes.push({
      nome: "HTTPS",
      status: "limpo",
      confianca: 85,
      motivo: "Conexão criptografada"
    });
    confiancaGeral += 85;
  } else {
    fontes.push({
      nome: "HTTPS",
      status: "suspeito",
      confianca: 60,
      motivo: "Sem criptografia (HTTP)"
    });
    scoreGeral += 30;
    confiancaGeral += 60;
  }

  // ========================================
  // 4. IDADE DO DOMÍNIO (Contexto)
  // ========================================
  // Nota: Em produção, seria consultado via WHOIS API
  // Por enquanto, usamos heurística simples
  const dominioNovo = hostname.length > 30 || hostname.includes("temp");
  if (dominioNovo) {
    fontes.push({
      nome: "Idade do Domínio",
      status: "suspeito",
      confianca: 70,
      motivo: "Domínio pode ser recém-criado"
    });
    scoreGeral += 15;
    confiancaGeral += 70;
  } else {
    fontes.push({
      nome: "Idade do Domínio",
      status: "limpo",
      confianca: 80,
      motivo: "Domínio estabelecido"
    });
    confiancaGeral += 80;
  }

  // ========================================
  // 5. PADRÕES DE PHISHING (Heurística)
  // ========================================
  const temPadroesFishing = /login|verify|confirm|update|urgent|action|secure|account/i.test(url);
  const urlEstruturalmenteIncomum = url.length > 100 || /_layouts|onedrive\.aspx|\/personal\//i.test(url);
  if ((temPadroesFishing && !ehConfiado) || urlEstruturalmenteIncomum) {
    fontes.push({
      nome: "Padrões de Phishing",
      status: "suspeito",
      confianca: 75,
      motivo: temPadroesFishing ? "URL contém palavras comuns em phishing" : "URL longa ou estrutura corporativa incomum"
    });
    scoreGeral += urlEstruturalmenteIncomum ? 25 : 20;
    confiancaGeral += 75;
  } else {
    fontes.push({
      nome: "Padrões de Phishing",
      status: "limpo",
      confianca: 85,
      motivo: "Sem padrões suspeitos detectados"
    });
    confiancaGeral += 85;
  }

  // ========================================
  // CÁLCULO FINAL
  // ========================================
  const hasMalicious = fontes.some((f) => f.status === "malicioso");
  const hasSuspicious = fontes.some((f) => f.status === "suspeito");
  const scoreGeral_Final = hasMalicious ? 100 : Math.round(scoreGeral / fontes.length);
  const confiancaGeral_Final = Math.round(confiancaGeral / fontes.length);

  let resumo = "";
  if (scoreGeral_Final <= 20 && !hasSuspicious) {
    resumo = "✅ Reputação limpa - URL parece segura";
  } else if (scoreGeral_Final <= 45) {
    resumo = "⚠️ Reputação mista - Características incomuns detectadas";
  } else if (scoreGeral_Final <= 70) {
    resumo = "🔴 Reputação questionável - Padrões suspeitos detectados";
  } else {
    resumo = "❌ Reputação comprometida - URL identificada como perigosa";
  }

  return {
    fontes,
    scoreGeral: scoreGeral_Final,
    confiancaGeral: confiancaGeral_Final,
    resumo
  };
}
