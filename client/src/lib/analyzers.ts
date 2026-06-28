import { validarURL, bloquearHostsInternos, isPrivateIP, detectarTyposquatting, isDominioRecente, hasValidHTTPS, isEncurtador } from "./security";

export function analyzeURLWithSecurity(url: string, scamPatterns: any[], knownScamDomains: string[]) {
  const result = {
    url: url,
    risks: [] as any[],
    isScam: false,
    score: 0
  };

  // 1. Validar URL
  if (!validarURL(url)) {
    result.risks.push({
      name: "URL Inválida",
      risk: "high",
      reason: "Esta não é uma URL válida ou usa protocolo não permitido"
    });
    result.score += 40;
    return result;
  }

  // 2. Bloquear hosts internos
  if (!bloquearHostsInternos(url)) {
    result.risks.push({
      name: "Host Interno Bloqueado",
      risk: "high",
      reason: "Esta URL aponta para um servidor local (possível SSRF)"
    });
    result.score += 50;
  }

  // 3. Bloquear IPs privados
  try {
    const hostname = new URL(url).hostname;
    if (isPrivateIP(hostname)) {
      result.risks.push({
        name: "IP Privado Detectado",
        risk: "high",
        reason: "Esta URL usa um IP privado (possível ataque interno)"
      });
      result.score += 50;
    }
  } catch {}

  // 4. Detectar Typosquatting
  const typoResult = detectarTyposquatting(url);
  if (typoResult.detected) {
    result.risks.push({
      name: "Possível Typosquatting",
      risk: "high",
      reason: `Esta URL imita ${typoResult.similar.join(", ")}`
    });
    result.score += 40;
  }

  // 5. Detectar Domínios Recentes
  if (isDominioRecente(url)) {
    result.risks.push({
      name: "Domínio Suspeito",
      risk: "high",
      reason: "Este domínio usa extensão gratuita frequentemente usada em golpes"
    });
    result.score += 30;
  }

  // 6. Verificar HTTPS
  if (!hasValidHTTPS(url)) {
    result.risks.push({
      name: "Sem Criptografia HTTPS",
      risk: "medium",
      reason: "Seus dados não estão protegidos neste site"
    });
    result.score += 20;
  }

  // 7. Detectar Encurtadores
  if (isEncurtador(url)) {
    result.risks.push({
      name: "URL Encurtada",
      risk: "high",
      reason: "Golpistas usam URLs encurtadas para esconder o destino real"
    });
    result.score += 30;
  }

  // 8. Verificar padrões de golpe
  scamPatterns.forEach(({ pattern, name, risk, reason }: any) => {
    if (pattern.test(url)) {
      result.risks.push({ name, risk, reason });
      result.score += risk === "high" ? 30 : 15;
    }
  });

  // 9. Verificar domínios conhecidos
  try {
    const domain = new URL(url).hostname;
    if (knownScamDomains.some(d => domain.includes(d))) {
      result.risks.push({
        name: "Domínio Malicioso Conhecido",
        risk: "high",
        reason: "Este domínio foi reportado como golpe"
      });
      result.score += 50;
    }
  } catch {}

  // Limitar score a 100
  result.score = Math.min(result.score, 100);
  result.isScam = result.score >= 40;
  
  return result;
}

export function getRiskColor(score: number): string {
  if (score >= 70) return "#dc2626"; // Vermelho - RISCO ALTO
  if (score >= 40) return "#f59e0b"; // Laranja - SUSPEITO
  return "#10b981"; // Verde - SEGURO
}

export function getRiskLabel(score: number): string {
  if (score >= 70) return "🔴 Alto Risco - Não clique";
  if (score >= 40) return "🟡 Suspeito - Verifique antes";
  return "🟢 Seguro - Domínio confiável";
}
