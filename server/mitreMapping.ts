/**
 * MITRE ATT&CK Mapping Service - Versão Detalhada
 * Mapeia ameaças detectadas para técnicas MITRE ATT&CK correspondentes
 * com táticas, sub-técnicas, mitigações e referências
 */

export interface MITRESubTechnique {
  id: string;
  name: string;
  description: string;
}

export interface MITREMitigation {
  id: string;
  name: string;
  description: string;
}

export interface MITREAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  tacticId: string;
  description: string;
  url: string;
  confidence: number;
  subTechniques?: MITRESubTechnique[];
  mitigations?: MITREMitigation[];
  detectionMethods?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Cores por tática para visualização
export const TACTIC_COLORS: Record<string, string> = {
  'Reconnaissance': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'Resource Development': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'Initial Access': 'bg-red-500/10 border-red-500/30 text-red-400',
  'Execution': 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  'Persistence': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  'Privilege Escalation': 'bg-red-600/10 border-red-600/30 text-red-500',
  'Defense Evasion': 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  'Credential Access': 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  'Discovery': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'Lateral Movement': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  'Collection': 'bg-green-500/10 border-green-500/30 text-green-400',
  'Command and Control': 'bg-gray-500/10 border-gray-500/30 text-gray-400',
  'Exfiltration': 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  'Impact': 'bg-red-700/10 border-red-700/30 text-red-600',
};

// Mapeamento de tipos de ameaça para técnicas MITRE detalhadas
const THREAT_TO_MITRE: Record<string, MITREAttackTechnique[]> = {
  // Phishing
  phishing: [
    {
      id: 'T1566',
      name: 'Phishing',
      tactic: 'Initial Access',
      tacticId: 'TA0001',
      description: 'Envio de mensagens de phishing para obter acesso inicial à rede ou credenciais',
      url: 'https://attack.mitre.org/techniques/T1566/',
      confidence: 95,
      riskLevel: 'critical',
      subTechniques: [
        {
          id: 'T1566.001',
          name: 'Spearphishing Attachment',
          description: 'Phishing com anexos maliciosos',
        },
        {
          id: 'T1566.002',
          name: 'Spearphishing Link',
          description: 'Phishing com links maliciosos',
        },
        {
          id: 'T1566.003',
          name: 'Spearphishing via Service',
          description: 'Phishing através de serviços de terceiros',
        },
      ],
      mitigations: [
        {
          id: 'M1017',
          name: 'User Training',
          description: 'Treinar usuários para reconhecer phishing',
        },
        {
          id: 'M1054',
          name: 'Software Configuration',
          description: 'Configurar filtros de email e antiphishing',
        },
      ],
      detectionMethods: [
        'Monitorar padrões de email suspeitos',
        'Analisar URLs em emails',
        'Verificar reputação de domínios remetentes',
        'Detectar anexos maliciosos',
      ],
    },
    {
      id: 'T1598',
      name: 'Phishing for Information',
      tactic: 'Reconnaissance',
      tacticId: 'TA0043',
      description: 'Coleta de informações através de phishing para preparar ataques posteriores',
      url: 'https://attack.mitre.org/techniques/T1598/',
      confidence: 85,
      riskLevel: 'high',
      subTechniques: [
        {
          id: 'T1598.001',
          name: 'Spearphishing Service',
          description: 'Phishing através de serviços populares',
        },
        {
          id: 'T1598.002',
          name: 'Spearphishing Attachment',
          description: 'Phishing com anexos para coleta de informações',
        },
        {
          id: 'T1598.003',
          name: 'Spearphishing Link',
          description: 'Phishing com links para coleta de informações',
        },
      ],
      mitigations: [
        {
          id: 'M1017',
          name: 'User Training',
          description: 'Educar usuários sobre phishing',
        },
      ],
      detectionMethods: [
        'Monitorar tentativas de phishing',
        'Analisar padrões de comunicação',
      ],
    },
  ],

  // Social Engineering
  'social-engineering': [
    {
      id: 'T1598',
      name: 'Phishing for Information',
      tactic: 'Reconnaissance',
      tacticId: 'TA0043',
      description: 'Engenharia social para coleta de informações',
      url: 'https://attack.mitre.org/techniques/T1598/',
      confidence: 90,
      riskLevel: 'high',
      subTechniques: [
        {
          id: 'T1598.001',
          name: 'Spearphishing Service',
          description: 'Engenharia social via serviços',
        },
        {
          id: 'T1598.003',
          name: 'Spearphishing Link',
          description: 'Engenharia social via links',
        },
      ],
      mitigations: [
        {
          id: 'M1017',
          name: 'User Training',
          description: 'Treinar contra engenharia social',
        },
      ],
      detectionMethods: [
        'Monitorar tentativas de engenharia social',
        'Analisar padrões de comunicação suspeitos',
      ],
    },
  ],

  // Malware
  malware: [
    {
      id: 'T1189',
      name: 'Drive-by Compromise',
      tactic: 'Initial Access',
      tacticId: 'TA0001',
      description: 'Compromisso através de acesso a website malicioso',
      url: 'https://attack.mitre.org/techniques/T1189/',
      confidence: 90,
      riskLevel: 'critical',
      mitigations: [
        {
          id: 'M1050',
          name: 'Exploit Protection',
          description: 'Usar proteção contra exploits',
        },
        {
          id: 'M1021',
          name: 'Restrict Web-Based Content',
          description: 'Restringir acesso a conteúdo web malicioso',
        },
      ],
      detectionMethods: [
        'Monitorar downloads de arquivos suspeitos',
        'Analisar comportamento de processos',
        'Verificar reputação de URLs',
      ],
    },
  ],

  // Credential Harvesting
  'credential-harvesting': [
    {
      id: 'T1110',
      name: 'Brute Force',
      tactic: 'Credential Access',
      tacticId: 'TA0006',
      description: 'Tentativa de força bruta para obter credenciais',
      url: 'https://attack.mitre.org/techniques/T1110/',
      confidence: 80,
      riskLevel: 'high',
      subTechniques: [
        {
          id: 'T1110.001',
          name: 'Password Guessing',
          description: 'Adivinhar senhas',
        },
        {
          id: 'T1110.002',
          name: 'Password Spraying',
          description: 'Testar senhas comuns',
        },
      ],
      mitigations: [
        {
          id: 'M1027',
          name: 'Password Policies',
          description: 'Implementar políticas de senha forte',
        },
        {
          id: 'M1036',
          name: 'Account Use Policies',
          description: 'Implementar bloqueio de conta após falhas',
        },
      ],
      detectionMethods: [
        'Monitorar tentativas de login falhadas',
        'Detectar padrões de força bruta',
      ],
    },
    {
      id: 'T1598',
      name: 'Phishing for Information',
      tactic: 'Reconnaissance',
      tacticId: 'TA0043',
      description: 'Coleta de credenciais através de phishing',
      url: 'https://attack.mitre.org/techniques/T1598/',
      confidence: 90,
      riskLevel: 'high',
      mitigations: [
        {
          id: 'M1017',
          name: 'User Training',
          description: 'Treinar contra phishing',
        },
      ],
      detectionMethods: [
        'Monitorar tentativas de phishing',
        'Analisar padrões de coleta de credenciais',
      ],
    },
  ],

  // Domain Impersonation
  'domain-impersonation': [
    {
      id: 'T1583.001',
      name: 'Acquire Infrastructure: Domains',
      tactic: 'Resource Development',
      tacticId: 'TA0042',
      description: 'Aquisição de domínios para impersonação',
      url: 'https://attack.mitre.org/techniques/T1583/001/',
      confidence: 85,
      riskLevel: 'high',
      mitigations: [
        {
          id: 'M1056',
          name: 'Pre-compromise',
          description: 'Monitorar registros de domínios similares',
        },
      ],
      detectionMethods: [
        'Monitorar registros de novos domínios similares',
        'Analisar padrões de impersonação',
        'Verificar certificados SSL',
      ],
    },
  ],

  // Suspicious Redirects
  redirects: [
    {
      id: 'T1598.003',
      name: 'Spearphishing Link',
      tactic: 'Reconnaissance',
      tacticId: 'TA0043',
      description: 'Redirecionamentos suspeitos para captura de dados',
      url: 'https://attack.mitre.org/techniques/T1598/003/',
      confidence: 75,
      riskLevel: 'medium',
      mitigations: [
        {
          id: 'M1017',
          name: 'User Training',
          description: 'Treinar usuários a verificar URLs',
        },
      ],
      detectionMethods: [
        'Monitorar redirecionamentos suspeitos',
        'Analisar cadeias de redirecionamento',
      ],
    },
  ],

  // New Domain
  'new-domain': [
    {
      id: 'T1583.001',
      name: 'Acquire Infrastructure: Domains',
      tactic: 'Resource Development',
      tacticId: 'TA0042',
      description: 'Domínio recentemente registrado para atividades maliciosas',
      url: 'https://attack.mitre.org/techniques/T1583/001/',
      confidence: 70,
      riskLevel: 'high',
      mitigations: [
        {
          id: 'M1056',
          name: 'Pre-compromise',
          description: 'Monitorar novos registros de domínios',
        },
      ],
      detectionMethods: [
        'Verificar idade do domínio',
        'Monitorar novos registros suspeitos',
        'Analisar padrões de registro',
      ],
    },
  ],
};

/**
 * Mapeia um tipo de ameaça para técnicas MITRE
 */
export function mapThreatToMITRE(threatType: string): MITREAttackTechnique[] {
  const techniques = THREAT_TO_MITRE[threatType.toLowerCase()];
  return techniques || [];
}

/**
 * Mapeia múltiplos tipos de ameaça para técnicas MITRE
 * Remove duplicatas e ordena por confiança
 */
export function mapThreatsToMITRE(threatTypes: string[]): MITREAttackTechnique[] {
  const techniqueMap = new Map<string, MITREAttackTechnique>();

  for (const threatType of threatTypes) {
    const techniques = mapThreatToMITRE(threatType);
    for (const technique of techniques) {
      const key = technique.id;
      const existing = techniqueMap.get(key);
      if (!existing || technique.confidence > existing.confidence) {
        techniqueMap.set(key, technique);
      }
    }
  }

  // Converter para array e ordenar por confiança
  return Array.from(techniqueMap.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Mapeia indicadores detectados em uma análise para técnicas MITRE
 * Baseado em padrões de risco e características da análise
 */
export function mapAnalysisResultsToMITRE(analysisResult: {
  isScam?: boolean;
  isMalicious?: boolean;
  threatTypes?: string[];
  hasPhishing?: boolean;
  hasMalware?: boolean;
  hasRedirects?: boolean;
  isNewDomain?: boolean;
  suspiciousIP?: boolean;
  sslIssues?: boolean;
  domainImpersonation?: boolean;
  [key: string]: any;
}): MITREAttackTechnique[] {
  const threatTypes: string[] = [];

  // Mapear indicadores para tipos de ameaça
  if (analysisResult.hasPhishing) threatTypes.push('phishing');
  if (analysisResult.hasMalware) threatTypes.push('malware');
  if (analysisResult.isScam) threatTypes.push('social-engineering');
  if (analysisResult.isMalicious) threatTypes.push('malware');
  if (analysisResult.hasRedirects) threatTypes.push('redirects');
  if (analysisResult.isNewDomain) threatTypes.push('new-domain');
  if (analysisResult.domainImpersonation) threatTypes.push('domain-impersonation');

  // Adicionar tipos de ameaça fornecidos
  if (analysisResult.threatTypes && Array.isArray(analysisResult.threatTypes)) {
    threatTypes.push(...analysisResult.threatTypes);
  }

  // Se não houver ameaças detectadas, retornar array vazio
  if (threatTypes.length === 0) {
    return [];
  }

  // Mapear para técnicas MITRE
  return mapThreatsToMITRE(threatTypes);
}

/**
 * Gera descrição em linguagem natural das técnicas MITRE
 */
export function generateMITREDescription(techniques: MITREAttackTechnique[]): string {
  if (techniques.length === 0) {
    return 'Nenhuma técnica MITRE ATT&CK identificada.';
  }

  const tactics = new Set(techniques.map(t => t.tactic));
  const tacticList = Array.from(tactics).join(', ');

  return `Análise identificou ${techniques.length} técnica(s) MITRE ATT&CK em ${tactics.size} tática(s): ${tacticList}`;
}

/**
 * Retorna cor da tática para visualização
 */
export function getTacticColor(tactic: string): string {
  return TACTIC_COLORS[tactic] || 'bg-gray-500/10 border-gray-500/30 text-gray-400';
}
