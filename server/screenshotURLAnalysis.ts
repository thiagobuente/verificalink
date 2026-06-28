/**
 * Screenshot URL Analysis Service
 * Extracts URLs from screenshots using OCR and analyzes them with URLhaus
 */

import { checkURLhaus, URLhausAnalysis } from './urlhausService';

export interface ScreenshotURLResult {
  url: string;
  analysis: URLhausAnalysis;
  confidence: number; // Confidence that this is a real URL (0-100)
}

export interface ScreenshotURLAnalysisResult {
  totalURLsFound: number;
  maliciousURLs: number;
  suspiciousURLs: number;
  cleanURLs: number;
  unknownURLs: number;
  urls: ScreenshotURLResult[];
  ocrText: string; // Full OCR text extracted
}

/**
 * Extract URLs from OCR text using regex
 * More permissive than email URLs since screenshots can have various formats
 */
export function extractURLsFromOCRText(ocrText: string): Array<{ url: string; confidence: number }> {
  if (!ocrText) return [];

  const urls: Array<{ url: string; confidence: number }> = [];
  const seen = new Set<string>();

  // Pattern 1: Full URLs with protocol (highest confidence)
  const fullURLRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]*)/gi;
  const fullMatches = ocrText.match(fullURLRegex) || [];
  fullMatches.forEach((url) => {
    try {
      new URL(url);
      if (!seen.has(url.toLowerCase())) {
        urls.push({ url, confidence: 95 });
        seen.add(url.toLowerCase());
      }
    } catch {
      // Invalid URL, skip
    }
  });

  // Pattern 2: Domain-like patterns (www.example.com, example.com)
  const domainRegex = /(?:www\.)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,})/gi;
  const domainMatches = ocrText.match(domainRegex) || [];
  domainMatches.forEach((domain) => {
    const normalizedDomain = domain.toLowerCase();
    if (!seen.has(normalizedDomain)) {
      const url = normalizedDomain.startsWith('http') ? normalizedDomain : `https://${normalizedDomain}`;
      try {
        new URL(url);
        urls.push({ url, confidence: 70 });
        seen.add(normalizedDomain);
      } catch {
        // Invalid domain, skip
      }
    }
  });

  // Pattern 3: IP addresses (high confidence for phishing)
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  const ipMatches = ocrText.match(ipRegex) || [];
  ipMatches.forEach((ip) => {
    if (!seen.has(ip)) {
      const url = `https://${ip}`;
      urls.push({ url, confidence: 85 }); // IP addresses are suspicious
      seen.add(ip);
    }
  });

  return urls;
}

/**
 * Analyze all URLs found in screenshot with URLhaus
 */
export async function analyzeScreenshotURLs(
  ocrText: string
): Promise<ScreenshotURLAnalysisResult> {
  const urlsWithConfidence = extractURLsFromOCRText(ocrText);

  if (urlsWithConfidence.length === 0) {
    return {
      totalURLsFound: 0,
      maliciousURLs: 0,
      suspiciousURLs: 0,
      cleanURLs: 0,
      unknownURLs: 0,
      urls: [],
      ocrText,
    };
  }

  // Analyze each URL with URLhaus
  const results: ScreenshotURLResult[] = [];
  let maliciousCount = 0;
  let suspiciousCount = 0;
  let cleanCount = 0;
  let unknownCount = 0;

  for (const { url, confidence } of urlsWithConfidence) {
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
        confidence,
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
        confidence,
      });
    }
  }

  return {
    totalURLsFound: urlsWithConfidence.length,
    maliciousURLs: maliciousCount,
    suspiciousURLs: suspiciousCount,
    cleanURLs: cleanCount,
    unknownURLs: unknownCount,
    urls: results,
    ocrText,
  };
}

/**
 * Get risk level based on screenshot URL analysis
 */
export function getScreenshotURLRiskLevel(
  result: ScreenshotURLAnalysisResult
): 'critical' | 'high' | 'medium' | 'low' | 'clean' {
  if (result.maliciousURLs > 0) return 'critical';
  if (result.suspiciousURLs > 0) return 'high';
  if (result.unknownURLs > 0) return 'medium';
  if (result.cleanURLs > 0 && result.totalURLsFound > 0) return 'low';
  return 'clean';
}

/**
 * Generate risk summary for screenshot URLs
 */
export function generateScreenshotURLRiskSummary(result: ScreenshotURLAnalysisResult): string {
  if (result.totalURLsFound === 0) {
    return 'Nenhuma URL encontrada na captura de tela';
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
