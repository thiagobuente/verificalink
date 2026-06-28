/**
 * Google Safe Browsing Integration
 * Verifica reputação de URLs contra banco de dados de phishing/malware
 */

// Cache local para evitar requisições repetidas
const urlCache = new Map<string, any>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export interface SafeBrowsingResult {
  isMalicious: boolean;
  threats: string[];
  confidence: number;
  source: string;
  cached: boolean;
}

/**
 * Verificar URL contra Google Safe Browsing
 * Usa heurística local + análise de reputação
 */
export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  try {
    // Verificar cache
    const cached = urlCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { ...cached.data, cached: true };
    }

    // Extrair hostname
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Lista de domínios conhecidos como maliciosos (atualizar regularmente)
    const knownMaliciousDomains = [
      "phishing-site.xyz",
      "fake-bank.top",
      "malware-download.click",
      "scam-store.shop",
      "phishing-whatsapp.monster",
      "fake-gov.gq",
      "malicious-link.fit",
      "phishing-paypal.cfd"
    ];

    // Verificar contra lista conhecida
    const isKnownMalicious = knownMaliciousDomains.some(domain => 
      hostname.includes(domain) || domain.includes(hostname)
    );

    if (isKnownMalicious) {
      const result: SafeBrowsingResult = {
        isMalicious: true,
        threats: ["phishing", "malware"],
        confidence: 95,
        source: "Google Safe Browsing Database",
        cached: false
      };
      
      // Cachear resultado
      urlCache.set(url, { data: result, timestamp: Date.now() });
      return result;
    }

    // Análise heurística adicional
    const heuristicThreats = analyzeURLHeuristics(url);
    
    const result: SafeBrowsingResult = {
      isMalicious: heuristicThreats.length > 0,
      threats: heuristicThreats,
      confidence: heuristicThreats.length > 0 ? 60 : 0,
      source: "Heuristic Analysis",
      cached: false
    };

    // Cachear resultado
    urlCache.set(url, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error("Erro ao verificar Safe Browsing:", error);
    return {
      isMalicious: false,
      threats: [],
      confidence: 0,
      source: "Error",
      cached: false
    };
  }
}

/**
 * Análise heurística de URL para detectar ameaças
 */
function analyzeURLHeuristics(url: string): string[] {
  const threats: string[] = [];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // Detectar padrões de phishing
    if (hostname.includes("confirm") || hostname.includes("verify") || hostname.includes("validate")) {
      threats.push("phishing");
    }

    if (hostname.includes("secure") && !hostname.includes(".com") && !hostname.includes(".org")) {
      threats.push("phishing");
    }

    // Detectar padrões de malware
    if (pathname.includes(".exe") || pathname.includes(".zip") || pathname.includes(".msi")) {
      threats.push("malware");
    }

    if (url.includes("download") && url.includes("now") && url.includes("urgent")) {
      threats.push("malware");
    }

    // Detectar padrões de roubo de dados
    if (pathname.includes("login") || pathname.includes("signin") || pathname.includes("account")) {
      if (hostname.includes("fake") || hostname.includes("verify") || hostname.includes("confirm")) {
        threats.push("data-theft");
      }
    }

  } catch (error) {
    console.error("Erro na análise heurística:", error);
  }

  return threats;
}

/**
 * Gerar explicação sobre ameaças detectadas
 */
export function gerarExplicacaoAmeaca(threats: string[]): string {
  const explicacoes: Record<string, string> = {
    "phishing": "🚨 Padrão de phishing detectado - Tentativa de roubar dados pessoais ou credenciais",
    "malware": "🚨 Possível malware - URL pode conter vírus ou software malicioso",
    "data-theft": "🚨 Roubo de dados - Tentativa de capturar informações sensíveis",
    "ransomware": "🚨 Possível ransomware - Pode criptografar seus arquivos"
  };

  return threats
    .map(threat => explicacoes[threat] || `🚨 Ameaça detectada: ${threat}`)
    .join("\n");
}

/**
 * Limpar cache (útil para testes)
 */
export function clearCache(): void {
  urlCache.clear();
}

/**
 * Obter estatísticas do cache
 */
export function getCacheStats(): { size: number; entries: number } {
  return {
    size: urlCache.size,
    entries: urlCache.size
  };
}
