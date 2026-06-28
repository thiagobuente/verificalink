/**
 * Utilitários de Segurança - OWASP Best Practices
 */

// 1. Validação Segura de URL
export function validarURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    const protocolosPermitidos = ["http:", "https:"];
    
    if (!protocolosPermitidos.includes(parsed.protocol)) {
      return false;
    }
    
    // Bloquear javascript: URLs
    if (url.startsWith("javascript:")) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// 2. Bloquear Hosts Internos
export function bloquearHostsInternos(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    const bloqueados = ["localhost", "127.0.0.1", "0.0.0.0"];
    
    if (bloqueados.includes(hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// 3. Bloquear IPs Privados
export function isPrivateIP(host: string): boolean {
  const privateIPRegex = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|127\.)/;
  return privateIPRegex.test(host);
}

// 4. Sanitização contra XSS
export function sanitizar(texto: string): string {
  return texto
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// 5. Usar textContent em vez de innerHTML
export function setTextSafely(element: HTMLElement, text: string): void {
  element.textContent = text;
}

// 6. Detectar Encurtadores
export function isEncurtador(url: string): boolean {
  const encurtadores = [
    "bit.ly",
    "tinyurl.com",
    "cutt.ly",
    "t.co",
    "goo.gl",
    "short.link",
    "ow.ly",
    "is.gd",
    "buff.ly"
  ];
  
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return encurtadores.some(enc => hostname.includes(enc));
  } catch {
    return false;
  }
}

// 7. Detectar Typosquatting
export function detectarTyposquatting(url: string): { detected: boolean; similar: string[] } {
  const marcasConhecidas: Record<string, string[]> = {
    "paypal.com": ["paypa1.com", "paypal-confirm.com", "paypal-verify.com"],
    "whatsapp.com": ["whats-app.com", "whatsapp-verify.com", "whatsapp-confirm.com"],
    "nubank.com.br": ["nub4nk.com.br", "nubank-login.com", "nubank-verify.com"],
    "itau.com.br": ["itau-login.com", "itau-verify.com", "itau-seguro.com"],
    "bradesco.com.br": ["bradesco-login.com", "bradesco-verify.com"],
    "caixa.gov.br": ["caixa-login.com", "caixa-verify.com"],
    "bb.com.br": ["banco-brasil.com", "bb-login.com", "bb-verify.com"]
  };
  
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    for (const [marca, typos] of Object.entries(marcasConhecidas)) {
      if (typos.some(typo => hostname.includes(typo))) {
        return { detected: true, similar: [marca] };
      }
    }
  } catch {
    // URL inválida
  }
  
  return { detected: false, similar: [] };
}

// 8. Detectar Domínios Recentes (heurística simples)
export function isDominioRecente(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Domínios suspeitos (gratuitos, recentes)
    const dominiosSuspeitos = [
      ".tk",    // Tokelau
      ".ml",    // Mali
      ".ga",    // Gabão
      ".cf",    // República Centro-Africana
      ".gq",    // Guiné Equatorial
      ".xyz",   // Novo TLD
      ".click", // Novo TLD
      ".download" // Novo TLD
    ];
    
    return dominiosSuspeitos.some(dominio => hostname.endsWith(dominio));
  } catch {
    return false;
  }
}

// 9. Validar HTTPS
export function hasValidHTTPS(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// 10. Exemplos Educativos de Golpes
export const exemplosGolpes = [
  {
    tipo: "Falso Suporte",
    exemplo: "suporte-whatsapp.net",
    descricao: "Domínio que imita suporte oficial"
  },
  {
    tipo: "Pix Falso",
    exemplo: "pix-seguro-login.com",
    descricao: "Tenta roubar dados de Pix"
  },
  {
    tipo: "Banco Falso",
    exemplo: "banco-verificacao.org",
    descricao: "Imita verificação de banco"
  },
  {
    tipo: "Confirmação Falsa",
    exemplo: "confirm-account-whatsapp.tk",
    descricao: "Pede confirmação de conta"
  },
  {
    tipo: "Atualização Falsa",
    exemplo: "update-whatsapp-now.com",
    descricao: "Oferece atualização falsa"
  }
];
