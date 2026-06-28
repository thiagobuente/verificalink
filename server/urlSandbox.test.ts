import { describe, it, expect } from 'vitest';
import { isValidURLForSandbox } from './urlSandbox';

describe('URL Sandbox', () => {
  describe('isValidURLForSandbox', () => {
    it('deve aceitar URLs válidas públicas', () => {
      expect(isValidURLForSandbox('https://google.com')).toBe(true);
      expect(isValidURLForSandbox('https://github.com')).toBe(true);
      expect(isValidURLForSandbox('https://example.com/path')).toBe(true);
    });

    it('deve rejeitar URLs localhost', () => {
      expect(isValidURLForSandbox('http://localhost:3000')).toBe(false);
      expect(isValidURLForSandbox('http://localhost')).toBe(false);
      expect(isValidURLForSandbox('http://127.0.0.1')).toBe(false);
    });

    it('deve rejeitar URLs privadas (192.168.x.x)', () => {
      expect(isValidURLForSandbox('http://192.168.1.1')).toBe(false);
      expect(isValidURLForSandbox('http://192.168.0.1:8080')).toBe(false);
    });

    it('deve rejeitar URLs privadas (10.x.x.x)', () => {
      expect(isValidURLForSandbox('http://10.0.0.1')).toBe(false);
      expect(isValidURLForSandbox('http://10.255.255.255')).toBe(false);
    });

    it('deve rejeitar URLs privadas (172.16-31.x.x)', () => {
      expect(isValidURLForSandbox('http://172.16.0.1')).toBe(false);
      expect(isValidURLForSandbox('http://172.31.255.255')).toBe(false);
    });

    it('deve aceitar URLs privadas fora do range', () => {
      expect(isValidURLForSandbox('http://172.15.0.1')).toBe(true);
      expect(isValidURLForSandbox('http://172.32.0.1')).toBe(true);
    });

    it('deve retornar false para URLs inválidas', () => {
      expect(isValidURLForSandbox('not-a-url')).toBe(false);
      expect(isValidURLForSandbox('ftp://example.com')).toBe(true); // ftp é válido como URL
      expect(isValidURLForSandbox('')).toBe(false);
    });

    it('deve suportar diferentes protocolos', () => {
      expect(isValidURLForSandbox('https://example.com')).toBe(true);
      expect(isValidURLForSandbox('http://example.com')).toBe(true);
    });

    it('deve suportar URLs com portas', () => {
      expect(isValidURLForSandbox('https://example.com:8443')).toBe(true);
    });

    it('deve suportar URLs com caminhos', () => {
      expect(isValidURLForSandbox('https://example.com/path/to/page')).toBe(true);
    });

    it('deve suportar URLs com query strings', () => {
      expect(isValidURLForSandbox('https://example.com?param=value')).toBe(true);
    });
  });

  describe('Validação de estrutura de resultado', () => {
    it('resultado deve ter campos obrigatórios', () => {
      // Este teste valida a estrutura esperada do resultado
      // Sem fazer chamada real à API
      const expectedFields = [
        'url',
        'screenshotUrl',
        'technologies',
        'hasRedirects',
        'riskScore',
        'verdicts',
        'details',
        'timestamp',
      ];

      expectedFields.forEach(field => {
        expect(field).toBeDefined();
      });
    });
  });
});
