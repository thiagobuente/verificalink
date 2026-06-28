/**
 * Trusted Domains Whitelist
 * Lista de domínios confiáveis para reduzir falsos positivos
 * Inclui: Microsoft, Google, Adobe, Dropbox, GitHub, LinkedIn, AWS, Cloudflare, OneDrive, SharePoint
 */

export interface TrustedDomainInfo {
  provider: string;
  category: string;
  description: string;
  skipPhishingHeuristics?: boolean; // Se true, não aplicar heurísticas de phishing
}

const TRUSTED_DOMAINS: Record<string, TrustedDomainInfo> = {
  // Microsoft
  'microsoft.com': { provider: 'Microsoft', category: 'Software', description: 'Microsoft Corporation' },
  'outlook.com': { provider: 'Microsoft', category: 'Email', description: 'Microsoft Outlook' },
  'hotmail.com': { provider: 'Microsoft', category: 'Email', description: 'Microsoft Hotmail' },
  'live.com': { provider: 'Microsoft', category: 'Email', description: 'Microsoft Live' },
  'office.com': { provider: 'Microsoft', category: 'Productivity', description: 'Microsoft Office 365' },
  'office365.com': { provider: 'Microsoft', category: 'Productivity', description: 'Microsoft Office 365' },
  'sharepoint.com': { provider: 'Microsoft', category: 'Collaboration', description: 'Microsoft SharePoint', skipPhishingHeuristics: true },
  'onedrive.com': { provider: 'Microsoft', category: 'Cloud Storage', description: 'Microsoft OneDrive', skipPhishingHeuristics: true },
  'teams.microsoft.com': { provider: 'Microsoft', category: 'Collaboration', description: 'Microsoft Teams' },
  'azure.microsoft.com': { provider: 'Microsoft', category: 'Cloud', description: 'Microsoft Azure' },
  'dynamics.com': { provider: 'Microsoft', category: 'Business', description: 'Microsoft Dynamics' },

  // Google
  'google.com': { provider: 'Google', category: 'Search', description: 'Google Search' },
  'gmail.com': { provider: 'Google', category: 'Email', description: 'Google Gmail' },
  'drive.google.com': { provider: 'Google', category: 'Cloud Storage', description: 'Google Drive', skipPhishingHeuristics: true },
  'docs.google.com': { provider: 'Google', category: 'Productivity', description: 'Google Docs' },
  'sheets.google.com': { provider: 'Google', category: 'Productivity', description: 'Google Sheets' },
  'slides.google.com': { provider: 'Google', category: 'Productivity', description: 'Google Slides' },
  'forms.google.com': { provider: 'Google', category: 'Productivity', description: 'Google Forms' },
  'meet.google.com': { provider: 'Google', category: 'Video Conference', description: 'Google Meet' },
  'calendar.google.com': { provider: 'Google', category: 'Productivity', description: 'Google Calendar' },
  'analytics.google.com': { provider: 'Google', category: 'Analytics', description: 'Google Analytics' },
  'ads.google.com': { provider: 'Google', category: 'Advertising', description: 'Google Ads' },

  // Dropbox
  'dropbox.com': { provider: 'Dropbox', category: 'Cloud Storage', description: 'Dropbox Cloud Storage' },

  // Adobe
  'adobe.com': { provider: 'Adobe', category: 'Software', description: 'Adobe Corporation' },
  'creative.adobe.com': { provider: 'Adobe', category: 'Software', description: 'Adobe Creative Cloud' },
  'acrobat.adobe.com': { provider: 'Adobe', category: 'Software', description: 'Adobe Acrobat' },

  // GitHub
  'github.com': { provider: 'GitHub', category: 'Development', description: 'GitHub Code Repository' },
  'github.io': { provider: 'GitHub', category: 'Development', description: 'GitHub Pages' },

  // LinkedIn
  'linkedin.com': { provider: 'LinkedIn', category: 'Social Network', description: 'LinkedIn Professional Network' },

  // AWS
  'aws.amazon.com': { provider: 'AWS', category: 'Cloud', description: 'Amazon Web Services' },
  'console.aws.amazon.com': { provider: 'AWS', category: 'Cloud', description: 'AWS Management Console' },
  'amazon.com': { provider: 'Amazon', category: 'E-commerce', description: 'Amazon Shopping' },

  // Cloudflare
  'cloudflare.com': { provider: 'Cloudflare', category: 'Security', description: 'Cloudflare CDN & Security' },
  'dash.cloudflare.com': { provider: 'Cloudflare', category: 'Security', description: 'Cloudflare Dashboard' },

  // DocuSign
  'docusign.com': { provider: 'DocuSign', category: 'E-signature', description: 'DocuSign Electronic Signature' },

  // Slack
  'slack.com': { provider: 'Slack', category: 'Communication', description: 'Slack Workspace Communication' },

  // Notion
  'notion.so': { provider: 'Notion', category: 'Productivity', description: 'Notion Workspace' },

  // Figma
  'figma.com': { provider: 'Figma', category: 'Design', description: 'Figma Design Tool' },

  // Zoom
  'zoom.us': { provider: 'Zoom', category: 'Video Conference', description: 'Zoom Video Conferencing' },

  // Bancos Brasileiros
  'bb.com.br': { provider: 'Banco do Brasil', category: 'Banking', description: 'Banco do Brasil' },
  'itau.com.br': { provider: 'Itaú', category: 'Banking', description: 'Itaú Unibanco' },
  'bradesco.com.br': { provider: 'Bradesco', category: 'Banking', description: 'Banco Bradesco' },
  'caixa.gov.br': { provider: 'Caixa Econômica', category: 'Banking', description: 'Caixa Econômica Federal' },
  'nubank.com.br': { provider: 'Nubank', category: 'Banking', description: 'Nubank' },
  'santander.com.br': { provider: 'Santander', category: 'Banking', description: 'Banco Santander' },
  'sicoob.com.br': { provider: 'Sicoob', category: 'Banking', description: 'Sicoob Cooperative Banking' },

  // Meta
  'facebook.com': { provider: 'Meta', category: 'Social Network', description: 'Facebook' },
  'instagram.com': { provider: 'Meta', category: 'Social Network', description: 'Instagram' },
  'whatsapp.com': { provider: 'Meta', category: 'Messaging', description: 'WhatsApp' },
  'web.whatsapp.com': { provider: 'Meta', category: 'Messaging', description: 'WhatsApp Web' },
  'messenger.com': { provider: 'Meta', category: 'Messaging', description: 'Facebook Messenger' },
  'meta.com': { provider: 'Meta', category: 'Technology', description: 'Meta Platforms' },

  // Apple
  'apple.com': { provider: 'Apple', category: 'Technology', description: 'Apple Inc.' },
  'icloud.com': { provider: 'Apple', category: 'Cloud', description: 'Apple iCloud' },
  'telegram.org': { provider: 'Telegram', category: 'Messaging', description: 'Telegram Messenger' },
  'twitter.com': { provider: 'X Corp', category: 'Social Network', description: 'X (formerly Twitter)' },
  'reddit.com': { provider: 'Reddit', category: 'Social Network', description: 'Reddit' },
  'wikipedia.org': { provider: 'Wikimedia', category: 'Reference', description: 'Wikipedia' },
  'stackoverflow.com': { provider: 'Stack Overflow', category: 'Development', description: 'Stack Overflow' },
  'stripe.com': { provider: 'Stripe', category: 'Payment', description: 'Stripe Payment Processing' },
  'paypal.com': { provider: 'PayPal', category: 'Payment', description: 'PayPal Payment Service' },
};

/**
 * Verificar se um domínio é confiável
 */
export function isTrustedDomain(domain: string): boolean {
  const normalizedDomain = domain.toLowerCase().trim();
  return normalizedDomain in TRUSTED_DOMAINS;
}

/**
 * Obter informações de um domínio confiável
 */
export function getTrustedDomainInfo(domain: string): TrustedDomainInfo | null {
  const normalizedDomain = domain.toLowerCase().trim();
  return TRUSTED_DOMAINS[normalizedDomain] || null;
}

/**
 * Verificar se deve pular heurísticas de phishing para este domínio
 */
export function shouldSkipPhishingHeuristics(domain: string): boolean {
  const info = getTrustedDomainInfo(domain);
  return info?.skipPhishingHeuristics ?? false;
}

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
 * Extrair domínio raiz de uma URL
 * Exemplo: https://mail.google.com → mail.google.com
 */
export function extractRootDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Verificar se URL é de um domínio confiável
 */
export function isURLFromTrustedDomain(url: string): boolean {
  const mainDomain = extractMainDomain(url);
  return isTrustedDomain(mainDomain);
}

/**
 * Obter lista de todos os domínios confiáveis
 */
export function getAllTrustedDomains(): string[] {
  return Object.keys(TRUSTED_DOMAINS);
}

/**
 * Obter lista de domínios confiáveis por categoria
 */
export function getTrustedDomainsByCategory(category: string): string[] {
  return Object.entries(TRUSTED_DOMAINS)
    .filter(([_, info]) => info.category === category)
    .map(([domain, _]) => domain);
}
