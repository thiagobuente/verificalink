/**
 * Tests for PDF Metadata Analyzer
 */

import { describe, it, expect } from 'vitest';
import { analyzePDFMetadata, PDFMetadata } from './pdfMetadataAnalyzer';

describe('PDF Metadata Analyzer', () => {
  describe('analyzePDFMetadata', () => {
    it('should detect missing creator', () => {
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        author: 'John Doe',
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors).toContain('Nenhum software criador identificado');
      expect(analysis.riskLevel).toBe('medium');
    });

    it('should detect suspicious creator names', () => {
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        author: 'John Doe',
        creator: 'malware-generator',
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors.some((f) => f.includes('suspeito'))).toBe(true);
      expect(analysis.riskLevel).toBe('high');
    });

    it('should detect missing author', () => {
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        creator: 'Adobe Acrobat',
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors).toContain('Autor não identificado');
    });

    it('should detect suspicious author names', () => {
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        author: 'admin',
        creator: 'Adobe Acrobat',
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors.some((f) => f.includes('Autor suspeito'))).toBe(true);
    });

    it('should detect phishing-like titles', () => {
      const metadata: PDFMetadata = {
        title: 'Urgent Payment Invoice',
        author: 'John Doe',
        creator: 'Adobe Acrobat',
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors.some((f) => f.includes('phishing'))).toBe(true);
    });

    it('should detect encrypted PDFs', () => {
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        author: 'John Doe',
        creator: 'Adobe Acrobat',
        encrypted: true,
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors).toContain('PDF criptografado');
    });

    it('should detect recently created PDFs', () => {
      const now = new Date();
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        author: 'John Doe',
        creator: 'Adobe Acrobat',
        creationDate: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors.some((f) => f.includes('semana'))).toBe(true);
    });

    it('should detect modified PDFs', () => {
      const now = new Date();
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        author: 'John Doe',
        creator: 'Adobe Acrobat',
        creationDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
        modificationDate: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskFactors).toContain('PDF modificado após criação');
    });

    it('should return low risk for legitimate PDF', () => {
      const now = new Date();
      const metadata: PDFMetadata = {
        title: 'Annual Report 2025',
        author: 'Company Inc',
        creator: 'Microsoft Word',
        producer: 'Adobe Acrobat',
        creationDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
        modificationDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), // Same as creation
        encrypted: false,
        pageCount: 20,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskLevel).toBe('low');
      expect(analysis.riskFactors.length).toBe(0);
    });

    it('should return critical risk for highly suspicious PDF', () => {
      const now = new Date();
      const metadata: PDFMetadata = {
        title: 'Verify Account Payment',
        author: 'admin',
        creator: 'malware',
        encrypted: true,
        creationDate: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
        pageCount: 1,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.riskLevel).toBe('critical');
      expect(analysis.riskFactors.length).toBeGreaterThanOrEqual(5);
    });

    it('should provide recommendations', () => {
      const metadata: PDFMetadata = {
        title: 'Urgent Update',
        author: 'unknown',
        creator: 'unknown',
        pageCount: 1,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations[0]).toContain('PDFs legítimos');
    });

    it('should detect suspicious patterns', () => {
      const metadata: PDFMetadata = {
        title: 'Test PDF',
        author: 'John Doe',
        creator: 'unknown',
        pageCount: 5,
      };

      const analysis = analyzePDFMetadata(metadata);
      expect(analysis.suspiciousPatterns.length).toBeGreaterThan(0);
    });
  });
});
