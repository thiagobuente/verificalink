import { describe, expect, it } from 'vitest';
import { getEnabledThreatIntelPlugins, threatIntelPlugins } from './registry';

describe('threat intel plugin registry', () => {
  it('registers independent integrations', () => {
    expect(threatIntelPlugins.map((plugin) => plugin.id)).toEqual(
      expect.arrayContaining(['virustotal', 'shodan', 'greynoise', 'abuseipdb', 'alienvault', 'censys']),
    );
  });

  it('queries enabled plugins through the shared interface', async () => {
    const plugin = getEnabledThreatIntelPlugins()[0];
    const result = await plugin.query('example.com');
    expect(result?.query).toBe('example.com');
  });
});
