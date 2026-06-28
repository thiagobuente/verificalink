import { describe, expect, it } from 'vitest';
import { IncidentCache } from '../../providers/storage/cache';
describe('cache leak guard', () => { it('starts empty', () => { expect(new IncidentCache(1).size()).toBe(0); }); });
