/**
 * DNS Analysis Module
 * Análise real de SPF, DKIM e DMARC usando dns/promises
 */

import { promises as dns } from 'dns';

interface SPFRecord {
  valid: boolean;
  record: string | null;
  mechanisms: string[];
  issues: string[];
}

interface DKIMRecord {
  valid: boolean;
  record: string | null;
  selector: string;
  issues: string[];
}

interface DMARCRecord {
  valid: boolean;
  record: string | null;
  policy: 'none' | 'quarantine' | 'reject' | null;
  issues: string[];
}

interface EmailAuthenticationAnalysis {
  domain: string;
  spf: SPFRecord;
  dkim: DKIMRecord;
  dmarc: DMARCRecord;
  overallScore: number;
  recommendations: string[];
}

/**
 * Analisa registro SPF real usando DNS
 */
export async function analyzeSPF(domain: string): Promise<SPFRecord> {
  try {
    const records = await dns.resolveTxt(domain);
    const spfRecord = records.find((record) =>
      record.join('').startsWith('v=spf1')
    );

    if (!spfRecord) {
      return {
        valid: false,
        record: null,
        mechanisms: [],
        issues: ['Nenhum registro SPF encontrado'],
      };
    }

    const spfString = spfRecord.join('');
    const mechanisms = spfString
      .split(' ')
      .filter((m) => m && m !== 'v=spf1')
      .slice(0, 10);

    const issues: string[] = [];

    // Validações
    if (mechanisms.length === 0) {
      issues.push('Nenhum mecanismo SPF configurado');
    }

    if (!mechanisms.some((m) => m.includes('~all') || m.includes('-all'))) {
      issues.push('Sem política de falha (all) definida');
    }

    if (mechanisms.length > 10) {
      issues.push('Muitos mecanismos SPF (limite DNS de 10)');
    }

    if (spfString.includes('~all')) {
      issues.push('SPF usa soft fail (~all) - recomenda-se usar -all');
    }

    return {
      valid: issues.length === 0,
      record: spfString,
      mechanisms,
      issues,
    };
  } catch (error) {
    return {
      valid: false,
      record: null,
      mechanisms: [],
      issues: [
        `Erro ao consultar SPF: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      ],
    };
  }
}

/**
 * Analisa registro DKIM real usando DNS
 */
export async function analyzeDKIM(
  domain: string,
  selector: string = 'default'
): Promise<DKIMRecord> {
  try {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    const records = await dns.resolveTxt(dkimDomain);
    const dkimRecord = records.find((record) =>
      record.join('').startsWith('v=DKIM1')
    );

    if (!dkimRecord) {
      return {
        valid: false,
        record: null,
        selector,
        issues: [`Nenhum registro DKIM encontrado para seletor "${selector}"`],
      };
    }

    const dkimString = dkimRecord.join('');
    const issues: string[] = [];

    // Validações
    if (!dkimString.includes('p=')) {
      issues.push('Chave pública não encontrada');
    }

    if (dkimString.includes('p=')) {
      const keyMatch = dkimString.match(/p=([^;]+)/);
      if (keyMatch && keyMatch[1].length < 100) {
        issues.push('Chave pública parece ser muito curta');
      }
    }

    return {
      valid: issues.length === 0,
      record: dkimString,
      selector,
      issues,
    };
  } catch (error) {
    return {
      valid: false,
      record: null,
      selector,
      issues: [
        `Erro ao consultar DKIM: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      ],
    };
  }
}

/**
 * Analisa registro DMARC real usando DNS
 */
export async function analyzeDMARC(domain: string): Promise<DMARCRecord> {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const records = await dns.resolveTxt(dmarcDomain);
    const dmarcRecord = records.find((record) =>
      record.join('').startsWith('v=DMARC1')
    );

    if (!dmarcRecord) {
      return {
        valid: false,
        record: null,
        policy: null,
        issues: ['Nenhum registro DMARC encontrado'],
      };
    }

    const dmarcString = dmarcRecord.join('');
    const issues: string[] = [];

    // Extrair policy
    let policy: 'none' | 'quarantine' | 'reject' | null = null;
    if (dmarcString.includes('p=reject')) {
      policy = 'reject';
    } else if (dmarcString.includes('p=quarantine')) {
      policy = 'quarantine';
    } else if (dmarcString.includes('p=none')) {
      policy = 'none';
    }

    // Validações
    if (policy === 'none') {
      issues.push('Policy configurada como "none" - não está bloqueando emails');
    }

    if (policy === 'quarantine') {
      issues.push(
        'Policy configurada como "quarantine" - considere usar "reject"'
      );
    }

    if (!dmarcString.includes('rua=') && !dmarcString.includes('ruf=')) {
      issues.push('Nenhum email de reporte configurado');
    }

    return {
      valid: issues.length === 0 && policy === 'reject',
      record: dmarcString,
      policy,
      issues,
    };
  } catch (error) {
    return {
      valid: false,
      record: null,
      policy: null,
      issues: [
        `Erro ao consultar DMARC: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      ],
    };
  }
}

/**
 * Análise completa de autenticação de email
 */
export async function analyzeEmailAuthentication(
  domain: string,
  dkimSelector: string = 'default'
): Promise<EmailAuthenticationAnalysis> {
  // Validar e limpar domínio
  if (!domain || domain.includes('@')) {
    const cleanDomain = domain.split('@')[1] || domain;
    domain = cleanDomain.toLowerCase().trim();
  }

  // Executar análises em paralelo
  const [spf, dkim, dmarc] = await Promise.all([
    analyzeSPF(domain),
    analyzeDKIM(domain, dkimSelector),
    analyzeDMARC(domain),
  ]);

  // Calcular score (0-100)
  let score = 0;

  // SPF (até 30 pontos)
  if (spf.valid && spf.record) {
    score += 30;
  } else if (spf.record && spf.issues.length <= 1) {
    score += 20;
  } else if (spf.record) {
    score += 10;
  }

  // DKIM (até 30 pontos)
  if (dkim.valid && dkim.record) {
    score += 30;
  } else if (dkim.record && dkim.issues.length <= 1) {
    score += 20;
  } else if (dkim.record) {
    score += 10;
  }

  // DMARC (até 40 pontos)
  if (dmarc.valid && dmarc.policy === 'reject') {
    score += 40;
  } else if (dmarc.record && dmarc.policy === 'quarantine') {
    score += 25;
  } else if (dmarc.record && dmarc.policy === 'none') {
    score += 10;
  } else if (dmarc.record) {
    score += 5;
  }

  score = Math.min(score, 100);

  // Gerar recomendações
  const recommendations: string[] = [];

  if (!spf.valid) {
    recommendations.push(
      'Implemente um registro SPF para autorizar servidores de email'
    );
  } else if (spf.issues.length > 0) {
    recommendations.push(`Revise SPF: ${spf.issues[0]}`);
  }

  if (!dkim.valid) {
    recommendations.push(
      'Configure DKIM para assinar digitalmente seus emails'
    );
  } else if (dkim.issues.length > 0) {
    recommendations.push(`Revise DKIM: ${dkim.issues[0]}`);
  }

  if (!dmarc.valid || dmarc.policy !== 'reject') {
    recommendations.push(
      'Configure DMARC com policy "reject" para máxima proteção'
    );
  } else if (dmarc.issues.length > 0) {
    recommendations.push(`Revise DMARC: ${dmarc.issues[0]}`);
  }

  if (score >= 90) {
    recommendations.push('✓ Autenticação de email configurada corretamente');
  }

  return {
    domain,
    spf,
    dkim,
    dmarc,
    overallScore: score,
    recommendations,
  };
}

/**
 * Validar domínio de email
 */
export function validateEmailDomain(email: string): {
  valid: boolean;
  domain: string;
  issues: string[];
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const issues: string[] = [];

  if (!emailRegex.test(email)) {
    issues.push('Formato de email inválido');
    return { valid: false, domain: '', issues };
  }

  const domain = email.split('@')[1];

  if (domain.length < 3) {
    issues.push('Domínio muito curto');
  }

  if (domain.includes('..')) {
    issues.push('Domínio contém pontos consecutivos');
  }

  if (!domain.includes('.')) {
    issues.push('Domínio não contém TLD');
  }

  return {
    valid: issues.length === 0,
    domain,
    issues,
  };
}

/**
 * Verificar se domínio é conhecido/confiável
 */
export function isDomainTrusted(domain: string): boolean {
  const trustedDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'protonmail.com',
    'icloud.com',
    'mail.com',
    'zoho.com',
    'tutanota.com',
    'fastmail.com',
  ];

  return trustedDomains.includes(domain.toLowerCase());
}
