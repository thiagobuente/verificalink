/**
 * MITRE ATT&CK Mapping Module
 * Mapeia sinais detectados para táticas e técnicas do framework MITRE ATT&CK
 */

export interface MITREAttackTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
  confidence: number; // 0-100
}

export interface MITREAttackMapping {
  techniques: MITREAttackTechnique[];
  disclaimer: string;
  referenceUrl: string;
}

// Banco de dados de técnicas MITRE ATT&CK
const MITRE_TECHNIQUES: Record<string, MITREAttackTechnique> = {
  'T1566': {
    id: 'T1566',
    name: 'Phishing',
    tactic: 'Initial Access',
    description: 'Envio de mensagens enganosas para induzir usuários a clicar em links maliciosos ou abrir anexos perigosos',
    url: 'https://attack.mitre.org/techniques/T1566/',
    confidence: 95
  },
  'T1566.002': {
    id: 'T1566.002',
    name: 'Phishing: Spearphishing Link',
    tactic: 'Initial Access',
    description: 'Envio de links maliciosos direcionados a usuários específicos',
    url: 'https://attack.mitre.org/techniques/T1566/002/',
    confidence: 90
  },
  'T1566.001': {
    id: 'T1566.001',
    name: 'Phishing: Spearphishing Attachment',
    tactic: 'Initial Access',
    description: 'Envio de anexos maliciosos (PDF, DOC, etc) para induzir execução de código',
    url: 'https://attack.mitre.org/techniques/T1566/001/',
    confidence: 92
  },
  'T1598': {
    id: 'T1598',
    name: 'Phishing for Information',
    tactic: 'Reconnaissance',
    description: 'Coleta de informações através de phishing para preparar ataques futuros',
    url: 'https://attack.mitre.org/techniques/T1598/',
    confidence: 85
  },
  'T1598.003': {
    id: 'T1598.003',
    name: 'Phishing for Information: Spearphishing Link',
    tactic: 'Reconnaissance',
    description: 'Uso de links para coletar informações sobre usuários',
    url: 'https://attack.mitre.org/techniques/T1598/003/',
    confidence: 80
  },
  'T1598.004': {
    id: 'T1598.004',
    name: 'Phishing for Information: Spearphishing Attachment',
    tactic: 'Reconnaissance',
    description: 'Uso de anexos para coletar informações sobre sistemas e usuários',
    url: 'https://attack.mitre.org/techniques/T1598/004/',
    confidence: 82
  },
  'T1187': {
    id: 'T1187',
    name: 'Forced Authentication',
    tactic: 'Credential Access',
    description: 'Forçar usuários a se autenticar em um servidor controlado pelo atacante',
    url: 'https://attack.mitre.org/techniques/T1187/',
    confidence: 88
  },
  'T1056': {
    id: 'T1056',
    name: 'Input Capture',
    tactic: 'Collection',
    description: 'Captura de entrada de usuários (keylogger, screenshot, etc)',
    url: 'https://attack.mitre.org/techniques/T1056/',
    confidence: 75
  },
  'T1113': {
    id: 'T1113',
    name: 'Screen Capture',
    tactic: 'Collection',
    description: 'Captura de screenshots para coletar informações sensíveis',
    url: 'https://attack.mitre.org/techniques/T1113/',
    confidence: 70
  },
  'T1115': {
    id: 'T1115',
    name: 'Clipboard Data',
    tactic: 'Collection',
    description: 'Coleta de dados da área de transferência',
    url: 'https://attack.mitre.org/techniques/T1115/',
    confidence: 65
  },
  'T1589': {
    id: 'T1589',
    name: 'Gather Victim Identity Information',
    tactic: 'Reconnaissance',
    description: 'Coleta de informações pessoais para personalizar ataques',
    url: 'https://attack.mitre.org/techniques/T1589/',
    confidence: 78
  },
  'T1598.001': {
    id: 'T1598.001',
    name: 'Phishing for Information: Spearphishing Service',
    tactic: 'Reconnaissance',
    description: 'Uso de serviços falsos para coletar informações',
    url: 'https://attack.mitre.org/techniques/T1598/001/',
    confidence: 76
  },
  'T1598.002': {
    id: 'T1598.002',
    name: 'Phishing for Information: Spearphishing Service',
    tactic: 'Reconnaissance',
    description: 'Uso de QR codes para coletar informações',
    url: 'https://attack.mitre.org/techniques/T1598/002/',
    confidence: 72
  },
  'T1583': {
    id: 'T1583',
    name: 'Acquire Infrastructure',
    tactic: 'Resource Development',
    description: 'Aquisição de infraestrutura para ataques (domínios, servidores, etc)',
    url: 'https://attack.mitre.org/techniques/T1583/',
    confidence: 85
  },
  'T1583.001': {
    id: 'T1583.001',
    name: 'Acquire Infrastructure: Domains',
    tactic: 'Resource Development',
    description: 'Registro de domínios para phishing e ataques',
    url: 'https://attack.mitre.org/techniques/T1583/001/',
    confidence: 90
  },
  'T1583.006': {
    id: 'T1583.006',
    name: 'Acquire Infrastructure: Web Services',
    tactic: 'Resource Development',
    description: 'Uso de serviços web para hospedar conteúdo malicioso',
    url: 'https://attack.mitre.org/techniques/T1583/006/',
    confidence: 80
  },
  'T1608': {
    id: 'T1608',
    name: 'Stage Capabilities',
    tactic: 'Resource Development',
    description: 'Preparação de ferramentas e conteúdo para ataques',
    url: 'https://attack.mitre.org/techniques/T1608/',
    confidence: 75
  },
  'T1608.004': {
    id: 'T1608.004',
    name: 'Stage Capabilities: Drive-by Target',
    tactic: 'Resource Development',
    description: 'Preparação de conteúdo malicioso para drive-by downloads',
    url: 'https://attack.mitre.org/techniques/T1608/004/',
    confidence: 78
  },
  'T1204': {
    id: 'T1204',
    name: 'User Execution',
    tactic: 'Execution',
    description: 'Execução de código através de ação do usuário (clicar em link, abrir anexo)',
    url: 'https://attack.mitre.org/techniques/T1204/',
    confidence: 92
  },
  'T1204.001': {
    id: 'T1204.001',
    name: 'User Execution: Malicious Link',
    tactic: 'Execution',
    description: 'Usuário clica em link malicioso',
    url: 'https://attack.mitre.org/techniques/T1204/001/',
    confidence: 95
  },
  'T1204.002': {
    id: 'T1204.002',
    name: 'User Execution: Malicious File',
    tactic: 'Execution',
    description: 'Usuário abre arquivo malicioso',
    url: 'https://attack.mitre.org/techniques/T1204/002/',
    confidence: 93
  },
};

/**
 * Mapeia sinais de análise para técnicas MITRE ATT&CK
 */
export function mapSignalsToMITRE(signals: {
  isPhishing?: boolean;
  isPhishingLink?: boolean;
  isSpearphishingAttachment?: boolean;
  isCredentialPhishing?: boolean;
  isSocialEngineering?: boolean;
  isQRCodePhishing?: boolean;
  isScreenshotAnalysis?: boolean;
  isEmailAnalysis?: boolean;
  isIOCAnalysis?: boolean;
  isDomainSuspicious?: boolean;
  isURLSuspicious?: boolean;
  isPDFSuspicious?: boolean;
  isRecognitionPhishing?: boolean;
}): MITREAttackMapping {
  const techniques: MITREAttackTechnique[] = [];
  const addedTechniques = new Set<string>();

  // Mapeamento de sinais para técnicas
  if (signals.isPhishing || signals.isPhishingLink) {
    addTechnique('T1566.002', techniques, addedTechniques);
  }

  if (signals.isSpearphishingAttachment) {
    addTechnique('T1566.001', techniques, addedTechniques);
  }

  if (signals.isCredentialPhishing) {
    addTechnique('T1187', techniques, addedTechniques);
    addTechnique('T1598.003', techniques, addedTechniques);
  }

  if (signals.isSocialEngineering) {
    addTechnique('T1598', techniques, addedTechniques);
    addTechnique('T1589', techniques, addedTechniques);
  }

  if (signals.isQRCodePhishing) {
    addTechnique('T1598.002', techniques, addedTechniques);
  }

  if (signals.isScreenshotAnalysis) {
    addTechnique('T1113', techniques, addedTechniques);
    addTechnique('T1056', techniques, addedTechniques);
  }

  if (signals.isEmailAnalysis) {
    addTechnique('T1566', techniques, addedTechniques);
  }

  if (signals.isIOCAnalysis) {
    addTechnique('T1583.001', techniques, addedTechniques);
  }

  if (signals.isDomainSuspicious) {
    addTechnique('T1583.001', techniques, addedTechniques);
  }

  if (signals.isURLSuspicious) {
    addTechnique('T1608.004', techniques, addedTechniques);
  }

  if (signals.isPDFSuspicious) {
    addTechnique('T1566.001', techniques, addedTechniques);
    addTechnique('T1204.002', techniques, addedTechniques);
  }

  if (signals.isRecognitionPhishing) {
    addTechnique('T1598.001', techniques, addedTechniques);
  }

  // Adicionar técnica de execução por usuário (sempre relevante em phishing)
  if (techniques.length > 0) {
    addTechnique('T1204', techniques, addedTechniques);
  }

  return {
    techniques: techniques.sort((a, b) => b.confidence - a.confidence),
    disclaimer: 'O mapeamento MITRE ATT&CK é educativo e aproximado, baseado nos indicadores detectados pela análise.',
    referenceUrl: 'https://attack.mitre.org'
  };
}

/**
 * Adiciona técnica ao array se ainda não foi adicionada
 */
function addTechnique(
  techniqueId: string,
  techniques: MITREAttackTechnique[],
  addedTechniques: Set<string>
): void {
  if (!addedTechniques.has(techniqueId) && MITRE_TECHNIQUES[techniqueId]) {
    techniques.push(MITRE_TECHNIQUES[techniqueId]);
    addedTechniques.add(techniqueId);
  }
}

/**
 * Obtém técnicas por tática
 */
export function getTechniquesByTactic(techniques: MITREAttackTechnique[]): Record<string, MITREAttackTechnique[]> {
  const byTactic: Record<string, MITREAttackTechnique[]> = {};

  techniques.forEach(technique => {
    if (!byTactic[technique.tactic]) {
      byTactic[technique.tactic] = [];
    }
    byTactic[technique.tactic].push(technique);
  });

  return byTactic;
}

/**
 * Gera descrição em português para uma técnica
 */
export function getTechniqueDescription(techniqueId: string): string {
  const technique = MITRE_TECHNIQUES[techniqueId];
  return technique ? technique.description : 'Técnica não identificada';
}

/**
 * Valida se um ID de técnica é válido
 */
export function isValidTechniqueId(techniqueId: string): boolean {
  return !!MITRE_TECHNIQUES[techniqueId];
}

/**
 * Obtém todas as técnicas de uma tática específica
 */
export function getTechniquesForTactic(tactic: string): MITREAttackTechnique[] {
  return Object.values(MITRE_TECHNIQUES).filter(t => t.tactic === tactic);
}

/**
 * Calcula score de confiança médio das técnicas
 */
export function calculateAverageConfidence(techniques: MITREAttackTechnique[]): number {
  if (techniques.length === 0) return 0;
  const sum = techniques.reduce((acc, t) => acc + t.confidence, 0);
  return Math.round(sum / techniques.length);
}
