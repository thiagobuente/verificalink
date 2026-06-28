import { describe, expect, it } from 'vitest';
import { getThreatIntelProviders } from '../../providers';

describe('provider health', () => {
  it('registers providers with health snapshots', () => {
    const providers = getThreatIntelProviders();
    expect(Array.isArray(providers)).toBe(true);
    for (const provider of providers) expect(provider.getHealth()).toHaveProperty('status');
  });
});
