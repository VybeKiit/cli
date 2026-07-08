import {
  CWS_ALL_REGIONS,
  isCwsAllRegions,
} from '@vybekiit/browser-automation/domains/extension/regions';
import { describe, expect, it } from 'vitest';

describe('CWS regions', () => {
  it('recognizes the canonical all-regions selection', () => {
    expect(isCwsAllRegions({ ...CWS_ALL_REGIONS })).toBe(true);
  });

  it('rejects partial or modified region selections', () => {
    expect(isCwsAllRegions({ ...CWS_ALL_REGIONS, Canada: false })).toBe(false);
    expect(isCwsAllRegions({ Canada: true })).toBe(false);
  });
});
