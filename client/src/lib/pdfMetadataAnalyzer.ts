/**
 * PDF Metadata Analyzer - Client-side helper
 */

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  trapped?: boolean;
  encrypted?: boolean;
  pageCount?: number;
}

export interface PDFMetadataAnalysis {
  metadata: PDFMetadata;
  riskFactors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousPatterns: string[];
  recommendations: string[];
}

/**
 * Analyze PDF metadata for suspicious patterns
 */
export function analyzePDFMetadata(metadata: PDFMetadata): PDFMetadataAnalysis {
  const riskFactors: string[] = [];
  const suspiciousPatterns: string[] = [];
  const recommendations: string[] = [];

  // Check for missing or suspicious creator/producer
  if (!metadata.creator && !metadata.producer) {
    riskFactors.push('Nenhum software criador identificado');
    suspiciousPatterns.push('PDF criado sem identificação de software');
    recommendations.push('PDFs legítimos geralmente identificam o software criador');
  }

  // Check for suspicious creator names
  const suspiciousCreators = [
    'unknown',
    'anonymous',
    'temp',
    'test',
    'malware',
    'trojan',
    'virus',
  ];
  if (metadata.creator) {
    const creatorLower = metadata.creator.toLowerCase();
    if (suspiciousCreators.some((s) => creatorLower.includes(s))) {
      riskFactors.push(`Software criador suspeito: ${metadata.creator}`);
      suspiciousPatterns.push('Padrão de nome de software anômalo');
      if (creatorLower.includes('unknown')) {
        recommendations.push('PDFs legítimos geralmente identificam o software criador');
      }
      recommendations.push('Verifique a origem do PDF com cautela');
    }
  }

  // Check for missing author
  if (!metadata.author) {
    riskFactors.push('Autor não identificado');
    suspiciousPatterns.push('PDF sem informação de autor');
    recommendations.push('PDFs legítimos geralmente contêm informação de autor');
  }

  // Check for suspicious author names
  const suspiciousAuthors = [
    'admin',
    'root',
    'system',
    'malware',
    'trojan',
    'virus',
    'hacker',
    'anonymous',
  ];
  if (metadata.author) {
    const authorLower = metadata.author.toLowerCase();
    if (suspiciousAuthors.some((s) => authorLower.includes(s))) {
      riskFactors.push(`Autor suspeito: ${metadata.author}`);
      suspiciousPatterns.push('Padrão de nome de autor anômalo');
      recommendations.push('Verifique a autenticidade do documento');
    }
  }

  // Check for missing title
  if (!metadata.title) {
    riskFactors.push('Título não definido');
    suspiciousPatterns.push('PDF sem título');
  }

  // Check for suspicious titles
  const suspiciousTitles = [
    'invoice',
    'payment',
    'urgent',
    'confirm',
    'verify',
    'update',
    'security',
    'account',
  ];
  if (metadata.title) {
    const titleLower = metadata.title.toLowerCase();
    if (suspiciousTitles.some((s) => titleLower.includes(s))) {
      riskFactors.push(`Título potencialmente phishing: ${metadata.title}`);
      suspiciousPatterns.push('Padrão de título comum em emails de phishing');
      recommendations.push('Verifique se o documento é legítimo antes de agir');
    }
  }

  // Check for encrypted PDF
  if (metadata.encrypted) {
    riskFactors.push('PDF criptografado');
    suspiciousPatterns.push('Conteúdo protegido por senha');
    recommendations.push('PDFs criptografados podem ocultar conteúdo malicioso');
  }

  // Check for very recent creation date (potential phishing)
  if (metadata.creationDate) {
    const now = new Date();
    const daysDiff = (now.getTime() - metadata.creationDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 1) {
      riskFactors.push('PDF criado há menos de uma semana (criado hoje, potencial phishing)');
      suspiciousPatterns.push('Documento muito recente');
      recommendations.push('Verifique a autenticidade de PDFs criados recentemente');
    } else if (daysDiff < 7) {
      riskFactors.push('PDF criado há menos de uma semana');
      suspiciousPatterns.push('Documento recente');
    }
  }

  // Check for modification date different from creation date
  if (
    metadata.creationDate &&
    metadata.modificationDate &&
    metadata.creationDate.getTime() !== metadata.modificationDate.getTime()
  ) {
    riskFactors.push('PDF modificado após criação');
    suspiciousPatterns.push('Conteúdo alterado');
    recommendations.push('Verifique se as alterações são legítimas');
  }

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const hasHighSeverity = riskFactors.some((f) => f.toLowerCase().includes('criador suspeito') || f.toLowerCase().includes('criptografado'));
  if (riskFactors.length >= 5) {
    riskLevel = 'critical';
  } else if (riskFactors.length >= 3 || hasHighSeverity) {
    riskLevel = 'high';
  } else if (riskFactors.length >= 1) {
    riskLevel = 'medium';
  }

  return {
    metadata,
    riskFactors,
    riskLevel,
    suspiciousPatterns,
    recommendations,
  };
}
