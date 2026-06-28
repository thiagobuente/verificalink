import { describe, expect, it } from 'vitest';
import { validateSOCPipeline } from '../../audit/pipeline/socPipelineValidator';
describe('full pipeline', () => { it('validates minimal shape', () => { expect(validateSOCPipeline({ ioc: 'x', riskScore: 0, providers: [] }).valid).toBe(true); }); });
