import { describe, expect, it } from 'vitest';
import { runWithTenant } from '../../platform/tenant/tenantContext';
import { iocAggregator } from '../../providers';

describe('ioc aggregation smoke', () => {
  it('returns consistent fallback shape', async () => {
    const result = await runWithTenant({ tenantId: 'test', role: 'admin', permissions: ['*'], rateLimit: 100 }, () => iocAggregator.analyze({ value: '8.8.8.8', type: 'ip' }));
    expect(result).toHaveProperty('tenantId', 'test');
    expect(result).toHaveProperty('riskScore');
    expect(Array.isArray(result.providers)).toBe(true);
  });
});
