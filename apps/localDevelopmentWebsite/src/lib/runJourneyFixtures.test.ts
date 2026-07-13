import { describe, expect, it } from 'vitest';
import { shouldUseJourneyFixtures } from './runJourneyFixtures';

describe('shouldUseJourneyFixtures', () => {
  it('enables from query param', () => {
    expect(shouldUseJourneyFixtures('?fixture=1', {})).toBe(true);
  });

  it('enables from env flags', () => {
    expect(shouldUseJourneyFixtures('', { NEXT_PUBLIC_ASSISTANT_FIXTURE: '1' })).toBe(true);
    expect(shouldUseJourneyFixtures('', { PLAYWRIGHT: '1' })).toBe(true);
  });

  it('defaults off', () => {
    expect(shouldUseJourneyFixtures('', {})).toBe(false);
  });
});
