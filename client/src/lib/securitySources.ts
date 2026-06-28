import { SourceData } from "@/components/ConsultedSourcesPanel";

/**
 * Configuração das 14 fontes de segurança consultadas
 * Usada para exibir transparência e credibilidade na análise
 */

export const SECURITY_SOURCES: Record<string, Omit<SourceData, "status" | "detections">> = {
  virustotal: {
    id: "virustotal",
    name: "VirusTotal",
    icon: "🦠",
    description: "Agregador de antivírus e engines de detecção",
  },
  google_safe_browsing: {
    id: "google_safe_browsing",
    name: "Google Safe Browsing",
    icon: "🔒",
    description: "Proteção contra phishing e malware do Google",
  },
  abuseipdb: {
    id: "abuseipdb",
    name: "AbuseIPDB",
    icon: "🚨",
    description: "Banco de dados de IPs abusivos e maliciosos",
  },
  urlhaus: {
    id: "urlhaus",
    name: "URLhaus",
    icon: "🏚️",
    description: "Repositório de URLs maliciosas",
  },
  alienvault_otx: {
    id: "alienvault_otx",
    name: "AlienVault OTX",
    icon: "👽",
    description: "Inteligência de ameaças de código aberto",
  },
  urlscan: {
    id: "urlscan",
    name: "URLScan",
    icon: "🔍",
    description: "Análise de segurança de URLs",
  },
  whoisxml: {
    id: "whoisxml",
    name: "WhoisXML",
    icon: "📋",
    description: "Informações WHOIS e DNS",
  },
  hybrid_analysis: {
    id: "hybrid_analysis",
    name: "Hybrid Analysis",
    icon: "🧪",
    description: "Análise comportamental de malware",
  },
  censys: {
    id: "censys",
    name: "Censys",
    icon: "🌐",
    description: "Inteligência de certificados SSL e hosts",
  },
  maxmind: {
    id: "maxmind",
    name: "MaxMind",
    icon: "📍",
    description: "Geolocalização e inteligência de IP",
  },
  project_honeypot: {
    id: "project_honeypot",
    name: "Project Honey Pot",
    icon: "🍯",
    description: "Detecção de spam e atividades maliciosas",
  },
  phishtank: {
    id: "phishtank",
    name: "PhishTank",
    icon: "🎣",
    description: "Banco de dados de URLs de phishing",
  },
  openphish: {
    id: "openphish",
    name: "OpenPhish",
    icon: "🐟",
    description: "Detecção automática de phishing",
  },
  local_analysis: {
    id: "local_analysis",
    name: "Análise Local",
    icon: "💻",
    description: "Heurísticas e padrões locais",
  },
};

/**
 * Mapear IDs de fontes para dados completos
 */
export const getSourceData = (sourceId: string): Omit<SourceData, "status"> | null => {
  return SECURITY_SOURCES[sourceId] || null;
};

/**
 * Obter todas as fontes em ordem
 */
export const getAllSources = (): string[] => {
  return Object.keys(SECURITY_SOURCES);
};

/**
 * Descrição das fontes para tooltips
 */
export const SOURCE_DESCRIPTIONS: Record<string, string> = {
  virustotal:
    "VirusTotal é um agregador que verifica arquivos e URLs contra 70+ antivírus e engines de detecção de malware.",
  google_safe_browsing:
    "Proteção do Google contra phishing, malware e software indesejado. Usado por Chrome e outros navegadores.",
  abuseipdb:
    "Banco de dados comunitário de IPs abusivos. Ajuda a identificar IPs usados em ataques e spam.",
  urlhaus:
    "Repositório de URLs maliciosas mantido pela Abuse.ch. Especializado em detectar URLs de distribuição de malware.",
  alienvault_otx:
    "Plataforma de inteligência de ameaças de código aberto. Compartilha indicadores de comprometimento (IOCs).",
  urlscan:
    "Serviço de análise de URLs que captura screenshots e analisa comportamento de websites.",
  whoisxml:
    "Fornece informações WHOIS, DNS e histórico de domínios para análise de reputação.",
  hybrid_analysis:
    "Plataforma de análise comportamental que executa arquivos em ambientes isolados para detectar malware.",
  censys:
    "Inteligência de certificados SSL/TLS e hosts. Ajuda a identificar certificados suspeitos.",
  maxmind:
    "Banco de dados de geolocalização de IPs. Identifica localização geográfica de servidores.",
  project_honeypot:
    "Projeto que coleta dados sobre spam, bots e atividades maliciosas na internet.",
  phishtank:
    "Banco de dados comunitário de URLs de phishing. Mantém registro de sites de phishing conhecidos.",
  openphish:
    "Sistema automático de detecção de phishing que identifica URLs suspeitas em tempo real.",
  local_analysis:
    "Análise local baseada em heurísticas, padrões de URL e estrutura de domínio.",
};
