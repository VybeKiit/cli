import { resolvePaceMs } from '@vybekiit/browserAutomation/core/pace';
import { describe, expect, it } from 'vitest';

describe('resolvePaceMs', () => {
  it('defaults to 800ms when unset', () => {
    expect(resolvePaceMs({})).toBe(800);
  });

  it('reads a positive override from AUTOMATE_PACE_MS', () => {
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: '1500' })).toBe(1500);
  });

  it('allows zero for fast local runs', () => {
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: '0' })).toBe(0);
  });

  it('falls back to default on non-numeric or negative values', () => {
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: 'slow' })).toBe(800);
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: '-100' })).toBe(800);
  });
});
