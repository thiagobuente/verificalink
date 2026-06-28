import { describe, expect, it } from 'vitest';
import { correlateIoc, detectIocType } from './correlationEngine';

describe('IOC correlation engine', () => {
  it('detects IOC types', () => {
    expect(detectIocType('185.199.108.153')).toBe('ip');
    expect(detectIocType('https://example.com/login')).toBe('url');
    expect(detectIocType('user@example.com')).toBe('email');
    expect(detectIocType('a'.repeat(64))).toBe('hash');
    expect(detectIocType('example.com')).toBe('domain');
  });

  it('returns relationships, sources and timeline', () => {
    const result = correlateIoc('login-banco-validacao.net');
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.relationships.length).toBeGreaterThan(0);
    expect(result.sources).toContain('VirusTotal');
    expect(result.timeline.length).toBeGreaterThan(0);
  });
});
