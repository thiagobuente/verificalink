/**
 * Lista de Domínios Confiáveis
 * Usado para evitar falsos positivos em análise de segurança
 * Domínios grandes e consolidados que não devem ser marcados como "Alto Risco"
 */

export const dominiosConfiaveis = [
  // Microsoft
  "microsoft.com",
  "sharepoint.com",
  "onedrive.live.com",
  "outlook.com",
  "office.com",
  "azure.com",
  "teams.microsoft.com",
  
  // Google
  "google.com",
  "googleusercontent.com",
  "accounts.google.com",
  "drive.google.com",
  "docs.google.com",
  "sheets.google.com",
  "gmail.com",
  "youtube.com",
  
  // Dropbox
  "dropbox.com",
  "dropboxusercontent.com",
  
  // GitHub
  "github.com",
  "githubusercontent.com",
  
  // Amazon
  "amazon.com",
  "aws.amazon.com",
  "s3.amazonaws.com",
  
  // Apple
  "apple.com",
  "icloud.com",
  "itunes.apple.com",
  
  // Meta/Facebook
  "facebook.com",
  "instagram.com",
  "whatsapp.com",
  "messenger.com",
  
  // LinkedIn
  "linkedin.com",
  
  // Twitter
  "twitter.com",
  "x.com",
  
  // Slack
  "slack.com",
  
  // Zoom
  "zoom.us",
  
  // Bancos Brasileiros Oficiais
  "bb.com.br",
  "itau.com.br",
  "bradesco.com.br",
  "santander.com.br",
  "caixa.gov.br",
  "bancointer.com.br",
  "nubank.com.br",
  "picpay.com",
  
  // Governo Brasileiro
  "gov.br",
  "receita.fazenda.gov.br",
  "inss.gov.br",
  
  // E-commerce
  "mercadolivre.com.br",
  "shopee.com.br",
  "aliexpress.com",
  "ebay.com",
  
  // Redes Sociais
  "tiktok.com",
  "reddit.com",
  "pinterest.com",
  "telegram.org",
  "discord.com",
  
  // Streaming
  "netflix.com",
  "spotify.com",
  "disneyplus.com",
  
  // Universidades
  "edu",
  "ac.uk",
  "edu.br",
  
  // Servicos de Email
  "protonmail.com",
  "tutanota.com",
  "mailbox.org",
  
  // VPNs e Seguranca
  "nordvpn.com",
  "expressvpn.com",
  "surfshark.com",
  
  // Ferramentas de Desenvolvimento
  "gitlab.com",
  "bitbucket.org",
  "heroku.com",
  "vercel.com",
  "netlify.com",
  
  // Hospedagem
  "digitalocean.com",
  "linode.com",
  "vultr.com",
  "hetzner.com",
  
  // Dominios Locais Brasileiros Confiaveis
  "b3.com.br",
  "bovespa.com.br",
  "correios.com.br",
  "anatel.gov.br",
  "anac.gov.br",
];

/**
 * Verifica se um domínio é confiável
 * @param hostname - Nome do host a verificar
 * @returns true se o domínio está na lista de confiáveis
 */
export function ehDominioConfiavel(hostname: string): boolean {
  const hostnameNormalizado = hostname.toLowerCase();
  
  return dominiosConfiaveis.some(dominio => {
    // Verificacao exata
    if (hostnameNormalizado === dominio) {
      return true;
    }
    
    // Verificacao de subdominio SEGURA
    // Garante que ha um ponto ANTES do dominio (ex: drive.google.com, nao notgoogle.com)
    if (hostnameNormalizado.endsWith("." + dominio)) {
      // Validacao extra: verificar que o que vem antes e um subdominio valido
      const prefixo = hostnameNormalizado.substring(0, hostnameNormalizado.length - dominio.length - 1);
      // Subdominio nao pode estar vazio e nao pode conter pontos suspeitos
      if (prefixo && !prefixo.includes("..")) {
        return true;
      }
    }
    
    // Verificacao de TLD generico (ex: .edu, .ac.uk)
    // Apenas para TLDs que comecam com ponto
    if (dominio.startsWith(".") && hostnameNormalizado.endsWith(dominio)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Obtém o domínio raiz de um hostname
 * @param hostname - Nome do host
 * @returns Domínio raiz (ex: google.com de drive.google.com)
 */
export function obterDominioRaiz(hostname: string): string {
  const partes = hostname.toLowerCase().split(".");
  
  if (partes.length <= 2) {
    return hostname.toLowerCase();
  }
  
  // Retorna os últimos 2 componentes (domínio + TLD)
  return partes.slice(-2).join(".");
}

/**
 * Verifica se é um domínio confiável mesmo com características suspeitas
 * Usado para evitar falsos positivos
 */
export function deveIgnorarCaracteristicaSuspeita(
  hostname: string,
  caracteristica: "urlLonga" | "muitosSubdominios" | "excessoNumeros"
): boolean {
  if (!ehDominioConfiavel(hostname)) {
    return false;
  }
  
  // Domínios confiáveis podem ter URLs longas (ex: drive.google.com com muitos parâmetros)
  // Mas não ignoramos typosquatting ou encurtadores
  
  if (caracteristica === "urlLonga") {
    return true; // URLs longas em domínios confiáveis são normais
  }
  
  if (caracteristica === "muitosSubdominios") {
    return true; // Subdomínios em domínios confiáveis são normais
  }
  
  if (caracteristica === "excessoNumeros") {
    return true; // Números em domínios confiáveis são normais
  }
  
  return false;
}
