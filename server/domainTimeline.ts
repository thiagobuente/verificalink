/**
 * Domain Timeline Service
 * Gera timeline de histórico de domínio com informações de registro e mudanças
 */

import { checkWhoisData } from './securityServices';

export interface DomainTimelineEvent {
  date: Date;
  type: 'registration' | 'expiration' | 'registrar-change' | 'threat' | 'analysis';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, any>;
}

export interface DomainTimeline {
  domain: string;
  registrationDate?: Date;
  expirationDate?: Date;
  registrar?: string;
  registrarCountry?: string;
  registrarCountryCode?: string;
  age: number; // em dias
  isNewDomain: boolean;
  riskScore: number;
  events: DomainTimelineEvent[];
  summary: string;
  recommendations: string[];
}

/**
 * Calcula idade do domínio em dias
 */
function calculateDomainAge(registrationDate: string | undefined): number {
  if (!registrationDate) return -1;

  try {
    const regDate = new Date(registrationDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - regDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
}

/**
 * Formata data para exibição
 */
function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Desconhecido';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Gera eventos de timeline baseado em dados WHOIS
 */
function generateTimelineEvents(whoisData: {
  registrationDate?: string;
  expirationDate?: string;
  registrar?: string;
  isNewDomain: boolean;
  riskScore: number;
  details: string[];
}): DomainTimelineEvent[] {
  const events: DomainTimelineEvent[] = [];

  // Evento de registro
  if (whoisData.registrationDate) {
    const regDate = new Date(whoisData.registrationDate);
    events.push({
      date: regDate,
      type: 'registration',
      title: 'Domínio Registrado',
      description: `Domínio registrado em ${formatDate(regDate)}`,
      severity: whoisData.isNewDomain ? 'warning' : 'info',
      details: {
        registrar: whoisData.registrar,
      },
    });
  }

  // Evento de expiração
  if (whoisData.expirationDate) {
    const expDate = new Date(whoisData.expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    events.push({
      date: expDate,
      type: 'expiration',
      title: 'Data de Expiração',
      description: `Domínio expira em ${formatDate(expDate)} (${daysUntilExpiration} dias)`,
      severity: daysUntilExpiration < 30 ? 'critical' : daysUntilExpiration < 90 ? 'warning' : 'info',
      details: {
        daysUntilExpiration,
      },
    });
  }

  // Eventos de ameaça detectados
  if (whoisData.details && whoisData.details.length > 0) {
    whoisData.details.forEach((detail) => {
      if (detail.includes('🚨')) {
        events.push({
          date: new Date(),
          type: 'threat',
          title: 'Ameaça Detectada',
          description: detail,
          severity: 'critical',
        });
      } else if (detail.includes('⚠️')) {
        events.push({
          date: new Date(),
          type: 'threat',
          title: 'Aviso de Segurança',
          description: detail,
          severity: 'warning',
        });
      }
    });
  }

  // Evento de análise atual
  events.push({
    date: new Date(),
    type: 'analysis',
    title: 'Análise Atual',
    description: `Score de risco: ${whoisData.riskScore}/100`,
    severity: whoisData.riskScore > 70 ? 'critical' : whoisData.riskScore > 40 ? 'warning' : 'info',
    details: {
      riskScore: whoisData.riskScore,
    },
  });

  // Ordenar eventos por data
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Gera recomendações baseado no histórico de domínio
 */
function generateRecommendations(timeline: {
  isNewDomain: boolean;
  riskScore: number;
  age: number;
  registrationDate?: string;
  expirationDate?: string;
}): string[] {
  const recommendations: string[] = [];

  if (timeline.isNewDomain) {
    recommendations.push('⚠️ Domínio muito recente - tenha cuidado extra ao acessar');
  }

  if (timeline.age < 90 && timeline.age >= 0) {
    recommendations.push('⚠️ Domínio recente (menos de 90 dias) - pode indicar atividade maliciosa');
  }

  if (timeline.riskScore > 70) {
    recommendations.push('🚨 Alto risco detectado - NÃO acesse este domínio');
  } else if (timeline.riskScore > 40) {
    recommendations.push('⚠️ Risco moderado - proceda com cautela');
  }

  // Verificar data de expiração próxima
  if (timeline.expirationDate) {
    try {
      const expDate = new Date(timeline.expirationDate);
      const now = new Date();
      const daysUntilExpiration = Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiration < 30 && daysUntilExpiration > 0) {
        recommendations.push('⚠️ Domínio expira em breve - pode ser abandonado ou renovado para continuar ataques');
      }
    } catch {
      // Ignorar erro ao calcular expiração
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Domínio aparenta ser legítimo - proceda normalmente');
  }

  return recommendations;
}

/**
 * Gera timeline completa de um domínio
 */
export async function generateDomainTimeline(domain: string): Promise<DomainTimeline> {
  try {
    // Extrair domínio se for uma URL completa
    let cleanDomain = domain;
    try {
      const urlObj = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
      cleanDomain = urlObj.hostname;
    } catch {
      // Se não for URL válida, usar como está
    }

    // Buscar dados WHOIS
    const whoisData = await checkWhoisData(cleanDomain);

    // Calcular idade do domínio
    const age = calculateDomainAge(whoisData.registrationDate);

    // Gerar eventos de timeline
    const events = generateTimelineEvents(whoisData);

    // Gerar recomendações
    const recommendations = generateRecommendations({
      isNewDomain: whoisData.isNewDomain,
      riskScore: whoisData.riskScore,
      age,
      registrationDate: whoisData.registrationDate,
      expirationDate: whoisData.expirationDate,
    });

    // Gerar resumo
    let summary = '';
    if (whoisData.isNewDomain) {
      summary = `Domínio muito recente (${age} dias). Registrado em ${formatDate(whoisData.registrationDate)}.`;
    } else if (age < 90) {
      summary = `Domínio recente (${age} dias). Registrado em ${formatDate(whoisData.registrationDate)}.`;
    } else {
      summary = `Domínio estabelecido (${age} dias). Registrado em ${formatDate(whoisData.registrationDate)}.`;
    }

    // Mapear registrador para país
    const registrarCountryMap: Record<string, { country: string; code: string }> = {
      'godaddy': { country: 'Estados Unidos', code: 'US' },
      'namecheap': { country: 'Estados Unidos', code: 'US' },
      'register.com': { country: 'Estados Unidos', code: 'US' },
      'domain.com': { country: 'Estados Unidos', code: 'US' },
      'enom': { country: 'Estados Unidos', code: 'US' },
      'network solutions': { country: 'Estados Unidos', code: 'US' },
      'verisign': { country: 'Estados Unidos', code: 'US' },
      'registro.br': { country: 'Brasil', code: 'BR' },
      'hostgator': { country: 'Estados Unidos', code: 'US' },
      'bluehost': { country: 'Estados Unidos', code: 'US' },
      'dreamhost': { country: 'Estados Unidos', code: 'US' },
      '1and1': { country: 'Alemanha', code: 'DE' },
      'ionos': { country: 'Alemanha', code: 'DE' },
      'ovh': { country: 'França', code: 'FR' },
      'gandi': { country: 'França', code: 'FR' },
      'nominet': { country: 'Reino Unido', code: 'GB' },
      'denic': { country: 'Alemanha', code: 'DE' },
      'cnnic': { country: 'China', code: 'CN' },
      'alibaba': { country: 'China', code: 'CN' },
      'tencent': { country: 'China', code: 'CN' },
    };

    let registrarCountry = 'Desconhecido';
    let registrarCountryCode = 'XX';

    if (whoisData.registrar) {
      const registrarLower = whoisData.registrar.toLowerCase();
      for (const [key, value] of Object.entries(registrarCountryMap)) {
        if (registrarLower.includes(key)) {
          registrarCountry = value.country;
          registrarCountryCode = value.code;
          break;
        }
      }
    }

    return {
      domain: cleanDomain,
      registrationDate: whoisData.registrationDate ? new Date(whoisData.registrationDate) : undefined,
      expirationDate: whoisData.expirationDate ? new Date(whoisData.expirationDate) : undefined,
      registrar: whoisData.registrar,
      registrarCountry,
      registrarCountryCode,
      age,
      isNewDomain: whoisData.isNewDomain,
      riskScore: whoisData.riskScore,
      events,
      summary,
      recommendations,
    };
  } catch (error) {
    console.error('Domain timeline error:', error);

    return {
      domain,
      age: -1,
      isNewDomain: false,
      riskScore: 0,
      registrarCountry: 'Desconhecido',
      registrarCountryCode: 'XX',
      events: [
        {
          date: new Date(),
          type: 'analysis',
          title: 'Erro na Análise',
          description: 'Não foi possível gerar timeline do domínio',
          severity: 'warning',
        },
      ],
      summary: 'Erro ao analisar domínio',
      recommendations: ['Tente novamente mais tarde'],
    };
  }
}

/**
 * Formata timeline para exibição em markdown
 */
export function formatTimelineAsMarkdown(timeline: DomainTimeline): string {
  let markdown = `# Timeline do Domínio: ${timeline.domain}\n\n`;

  markdown += `**Resumo:** ${timeline.summary}\n\n`;
  markdown += `**Registrador:** ${timeline.registrar || 'Desconhecido'}\n`;
  markdown += `**Idade:** ${timeline.age >= 0 ? `${timeline.age} dias` : 'Desconhecido'}\n`;
  markdown += `**Score de Risco:** ${timeline.riskScore}/100\n\n`;

  markdown += `## Recomendações\n`;
  timeline.recommendations.forEach((rec) => {
    markdown += `- ${rec}\n`;
  });

  markdown += `\n## Timeline de Eventos\n`;
  timeline.events.forEach((event) => {
    const icon = event.severity === 'critical' ? '🚨' : event.severity === 'warning' ? '⚠️' : 'ℹ️';
    markdown += `- **${formatDate(event.date)}** - ${icon} ${event.title}: ${event.description}\n`;
  });

  return markdown;
}
