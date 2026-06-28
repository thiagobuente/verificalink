/**
 * PDF URL Analysis Service
 * Extracts URLs from PDF documents and analyzes them with URLhaus
 */

import { checkURLhaus, URLhausAnalysis } from './urlhausService';

export interface PDFURLResult {
  url: string;
  analysis: URLhausAnalysis;
  confidence: number; // Confidence that this is a real URL (0-100)
  pageNumber?: number; // Which page the URL was found on
}

export interface PDFURLAnalysisResult {
  totalURLsFound: number;
  maliciousURLs: number;
  suspiciousURLs: number;
  cleanURLs: number;
  unknownURLs: number;
  urls: PDFURLResult[];
  totalPages: number;
}

/**
 * Extract URLs from PDF text
 * PDFs can contain URLs in various formats
 */
export function extractURLsFromPDFText(pdfText: string, pageNumber?: number): Array<{ url: string; confidence: number }> {
  if (!pdfText) return [];

  const urls: Array<{ url: string; confidence: number }> = [];
  const seen = new Set<string>();

  // Pattern 1: Full URLs with protocol (highest confidence)
  const fullURLRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]*)/gi;
  const fullMatches = pdfText.match(fullURLRegex) || [];
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
  const domainMatches = pdfText.match(domainRegex) || [];
  domainMatches.forEach((domain) => {
    const normalizedDomain = domain.toLowerCase();
    if (!seen.has(normalizedDomain)) {
      const url = normalizedDomain.startsWith('http') ? normalizedDomain : `https://${normalizedDomain}`;
      try {
        new URL(url);
        urls.push({ url, confidence: 75 });
        seen.add(normalizedDomain);
      } catch {
        // Invalid domain, skip
      }
    }
  });

  // Pattern 3: IP addresses (high confidence for phishing)
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  const ipMatches = pdfText.match(ipRegex) || [];
  ipMatches.forEach((ip) => {
    if (!seen.has(ip)) {
      const url = `https://${ip}`;
      urls.push({ url, confidence: 85 }); // IP addresses are suspicious
      seen.add(ip);
    }
  });

  // Pattern 4: URLs in text like "Click here: [url]" or "Visit [url]"
  const contextURLRegex = /(?:visit|click|go to|access|view|see|open|link|url|site|website|web)[\s:]*([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,})/gi;
  const contextMatches = pdfText.match(contextURLRegex) || [];
  contextMatches.forEach((match) => {
    const domainMatch = match.match(/([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,})/i);
    if (domainMatch) {
      const domain = domainMatch[0].toLowerCase();
      if (!seen.has(domain)) {
        const url = `https://${domain}`;
        try {
          new URL(url);
          urls.push({ url, confidence: 70 });
          seen.add(domain);
        } catch {
          // Invalid domain, skip
        }
      }
    }
  });

  return urls;
}

/**
 * Analyze all URLs found in PDF with URLhaus
 */
export async function analyzePDFURLs(
  pdfText: string,
  totalPages: number = 1
): Promise<PDFURLAnalysisResult> {
  const urlsWithConfidence = extractURLsFromPDFText(pdfText);

  if (urlsWithConfidence.length === 0) {
    return {
      totalURLsFound: 0,
      maliciousURLs: 0,
      suspiciousURLs: 0,
      cleanURLs: 0,
      unknownURLs: 0,
      urls: [],
      totalPages,
    };
  }

  // Analyze each URL with URLhaus
  const results: PDFURLResult[] = [];
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
    totalPages,
  };
}

/**
 * Get risk level based on PDF URL analysis
 */
export function getPDFURLRiskLevel(
  result: PDFURLAnalysisResult
): 'critical' | 'high' | 'medium' | 'low' | 'clean' {
  if (result.maliciousURLs > 0) return 'critical';
  if (result.suspiciousURLs > 0) return 'high';
  if (result.unknownURLs > 0) return 'medium';
  if (result.cleanURLs > 0 && result.totalURLsFound > 0) return 'low';
  return 'clean';
}

/**
 * Generate risk summary for PDF URLs
 */
export function generatePDFURLRiskSummary(result: PDFURLAnalysisResult): string {
  if (result.totalURLsFound === 0) {
    return 'Nenhuma URL encontrada no documento PDF';
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
