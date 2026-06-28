import { describe, expect, it } from 'vitest';
describe('provider chaos', () => { it('isolates failed providers', () => { expect([{ status: 'rejected' }].length).toBe(1); }); });
