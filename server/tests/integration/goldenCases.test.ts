import { describe, expect, it } from 'vitest';
import { GoldenIOCSet } from '../golden/goldenIOCSet';

describe('golden IOC set', () => {
  it('contains fixed SOC regression cases', () => {
    expect(GoldenIOCSet.length).toBe(4);
    expect(GoldenIOCSet.every((item) => item.ioc && item.type)).toBe(true);
  });
});
