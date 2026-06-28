/**
 * Tests for PDF URL Analysis Service
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  extractURLsFromPDFText,
  analyzePDFURLs,
  getPDFURLRiskLevel,
  generatePDFURLRiskSummary,
} from './pdfURLAnalysis';

describe('PDF URL Analysis Service', () => {
  describe('extractURLsFromPDFText', () => {
    it('should extract full URLs with protocol', () => {
      const text = 'Visit https://example.com for more info';
      const urls = extractURLsFromPDFText(text);
      expect(urls).toContainEqual(expect.objectContaining({ url: 'https://example.com' }));
    });

    it('should extract multiple URLs', () => {
      const text = `
        Check https://google.com and https://github.com
        Also visit http://example.org
      `;
      const urls = extractURLsFromPDFText(text);
      expect(urls.length).toBeGreaterThanOrEqual(3);
    });

    it('should extract domain-like patterns', () => {
      const text = 'Visit www.example.com or example.com';
      const urls = extractURLsFromPDFText(text);
      expect(urls.length).toBeGreaterThan(0);
    });

    it('should extract IP addresses', () => {
      const text = 'Server at 192.168.1.1 or 10.0.0.1';
      const urls = extractURLsFromPDFText(text);
      expect(urls.length).toBeGreaterThan(0);
    });

    it('should avoid duplicates', () => {
      const text = 'https://example.com and https://example.com again';
      const urls = extractURLsFromPDFText(text);
      const uniqueUrls = new Set(urls.map((u) => u.url.toLowerCase()));
      expect(uniqueUrls.size).toBe(1);
    });

    it('should return empty array for text without URLs', () => {
      const text = 'This is just plain text without any links';
      const urls = extractURLsFromPDFText(text);
      expect(urls.length).toBe(0);
    });

    it('should handle empty string', () => {
      const urls = extractURLsFromPDFText('');
      expect(urls).toEqual([]);
    });
  });

  describe('getPDFURLRiskLevel', () => {
    it('should return critical for malicious URLs', () => {
      const result = {
        totalURLsFound: 1,
        maliciousURLs: 1,
        suspiciousURLs: 0,
        cleanURLs: 0,
        unknownURLs: 0,
        urls: [],
        totalPages: 1,
      };
      expect(getPDFURLRiskLevel(result)).toBe('critical');
    });

    it('should return high for suspicious URLs', () => {
      const result = {
        totalURLsFound: 1,
        maliciousURLs: 0,
        suspiciousURLs: 1,
        cleanURLs: 0,
        unknownURLs: 0,
        urls: [],
        totalPages: 1,
      };
      expect(getPDFURLRiskLevel(result)).toBe('high');
    });

    it('should return medium for unknown URLs', () => {
      const result = {
        totalURLsFound: 1,
        maliciousURLs: 0,
        suspiciousURLs: 0,
        cleanURLs: 0,
        unknownURLs: 1,
        urls: [],
        totalPages: 1,
      };
      expect(getPDFURLRiskLevel(result)).toBe('medium');
    });

    it('should return low for clean URLs', () => {
      const result = {
        totalURLsFound: 1,
        maliciousURLs: 0,
        suspiciousURLs: 0,
        cleanURLs: 1,
        unknownURLs: 0,
        urls: [],
        totalPages: 1,
      };
      expect(getPDFURLRiskLevel(result)).toBe('low');
    });

    it('should return clean for no URLs', () => {
      const result = {
        totalURLsFound: 0,
        maliciousURLs: 0,
        suspiciousURLs: 0,
        cleanURLs: 0,
        unknownURLs: 0,
        urls: [],
        totalPages: 1,
      };
      expect(getPDFURLRiskLevel(result)).toBe('clean');
    });
  });

  describe('generatePDFURLRiskSummary', () => {
    it('should generate summary for no URLs', () => {
      const result = {
        totalURLsFound: 0,
        maliciousURLs: 0,
        suspiciousURLs: 0,
        cleanURLs: 0,
        unknownURLs: 0,
        urls: [],
        totalPages: 1,
      };
      const summary = generatePDFURLRiskSummary(result);
      expect(summary).toContain('Nenhuma URL');
    });

    it('should include malicious count in summary', () => {
      const result = {
        totalURLsFound: 2,
        maliciousURLs: 1,
        suspiciousURLs: 0,
        cleanURLs: 1,
        unknownURLs: 0,
        urls: [],
        totalPages: 1,
      };
      const summary = generatePDFURLRiskSummary(result);
      expect(summary).toContain('1');
      expect(summary).toContain('maliciosa');
    });

    it('should include all threat types', () => {
      const result = {
        totalURLsFound: 4,
        maliciousURLs: 1,
        suspiciousURLs: 1,
        cleanURLs: 1,
        unknownURLs: 1,
        urls: [],
        totalPages: 1,
      };
      const summary = generatePDFURLRiskSummary(result);
      expect(summary).toContain('maliciosa');
      expect(summary).toContain('suspeita');
      expect(summary).toContain('limpa');
      expect(summary).toContain('desconhecida');
    });
  });
});
