/**
 * Email URL Analysis Service
 * Extracts URLs from email bodies and analyzes them with URLhaus
 */

import { checkURLhaus, URLhausAnalysis } from './urlhausService';

export interface EmailURLResult {
  url: string;
  analysis: URLhausAnalysis;
  position: number; // Position in email body
}

export interface EmailURLAnalysisResult {
  totalURLs: number;
  maliciousURLs: number;
  suspiciousURLs: number;
  cleanURLs: number;
  unknownURLs: number;
  urls: EmailURLResult[];
}

/**
 * Extract URLs from email body using regex
 */
export function extractURLsFromEmail(emailBody: string): string[] {
  if (!emailBody) return [];

  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]*)/gi;
  const matches = emailBody.match(urlRegex) || [];

  // Remove duplicates and invalid URLs
  const uniqueURLs = Array.from(new Set(matches));
  
  return uniqueURLs.filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Analyze all URLs in email body with URLhaus
 */
export async function analyzeEmailURLs(emailBody: string): Promise<EmailURLAnalysisResult> {
  const urls = extractURLsFromEmail(emailBody);

  if (urls.length === 0) {
    return {
      totalURLs: 0,
      maliciousURLs: 0,
      suspiciousURLs: 0,
      cleanURLs: 0,
      unknownURLs: 0,
      urls: [],
    };
  }

  // Analyze each URL with URLhaus
  const results: EmailURLResult[] = [];
  let maliciousCount = 0;
  let suspiciousCount = 0;
  let cleanCount = 0;
  let unknownCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const analysis = await checkURLhaus(url);

      if (analysis.isMalicious) {
        if (analysis.status === 'malicious') {
          maliciousCount++;
        } else if (analysis.status === 'offline') {
          suspiciousCount++;
        }
      } else if (analysis.status === 'clean') {
        cleanCount++;
      } else {
        unknownCount++;
      }

      results.push({
        url,
        analysis,
        position: i,
      });
    } catch (error) {
      console.error(`Error analyzing URL ${url}:`, error);
      unknownCount++;
      results.push({
        url,
        analysis: {
          isMalicious: false,
          threat: null,
          tags: [],
          dateAdded: null,
          status: 'error',
          reference: null,
        },
        position: i,
      });
    }
  }

  return {
    totalURLs: urls.length,
    maliciousURLs: maliciousCount,
    suspiciousURLs: suspiciousCount,
    cleanURLs: cleanCount,
    unknownURLs: unknownCount,
    urls: results,
  };
}

/**
 * Get risk level based on URL analysis
 */
export function getEmailURLRiskLevel(result: EmailURLAnalysisResult): 'critical' | 'high' | 'medium' | 'low' | 'clean' {
  if (result.maliciousURLs > 0) return 'critical';
  if (result.suspiciousURLs > 0) return 'high';
  if (result.unknownURLs > 0) return 'medium';
  if (result.cleanURLs > 0 && result.totalURLs > 0) return 'low';
  return 'clean';
}

/**
 * Generate risk summary for email URLs
 */
export function generateEmailURLRiskSummary(result: EmailURLAnalysisResult): string {
  if (result.totalURLs === 0) {
    return 'Nenhuma URL encontrada no email';
  }

  const parts: string[] = [];

  if (result.maliciousURLs > 0) {
    parts.push(`🚨 ${result.maliciousURLs} URL(s) maliciosa(s)`);
  }

  if (result.suspiciousURLs > 0) {
    parts.push(`⚠️ ${result.suspiciousURLs} URL(s) suspeita(s)`);
  }

  if (result.cleanURLs > 0) {
    parts.push(`✅ ${result.cleanURLs} URL(s) limpa(s)`);
  }

  if (result.unknownURLs > 0) {
    parts.push(`❓ ${result.unknownURLs} URL(s) desconhecida(s)`);
  }

  return parts.join(' | ');
}
