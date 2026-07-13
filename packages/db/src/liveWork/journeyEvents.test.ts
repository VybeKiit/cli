import { describe, expect, it } from 'vitest';
import { toDataLiveWorkErrorEvent, toDataLiveWorkJourneyEvents } from './journeyEvents';
import type { DataLiveWorkResult } from './types';

const success = (partial: Partial<DataLiveWorkResult> = {}): DataLiveWorkResult => ({
  provider: 'neon',
  ephemeral: true,
  hopped: false,
  skipped: ['supabase'],
  pin: { DATA_PROVIDER: 'neon', DATABASE_URL: 'postgresql://secret' },
  verified: true,
  buyerMessage: 'Your place that remembers things is ready on Neon.',
  ...partial,
});

describe('toDataLiveWorkJourneyEvents', () => {
  it('emits start/end pairs covering database toolHints', () => {
    const events = toDataLiveWorkJourneyEvents(success());
    expect(events.length).toBeGreaterThanOrEqual(8);
    expect(events.every((e) => e.phase === 'start' || e.phase === 'end')).toBe(true);
    const names = events.map((e) => e.name).join(' ');
    expect(names).toMatch(/neon/);
    expect(names).toMatch(/connect/);
    expect(names).toMatch(/health/);
    expect(names).toMatch(/verify/);
    expect(names).toMatch(/schema/);
  });

  it('never puts connection strings in event details', () => {
    const events = toDataLiveWorkJourneyEvents(
      success({ databaseUrl: 'postgresql://u:p@host/db' }),
    );
    const blob = JSON.stringify(events);
    expect(blob).not.toContain('postgresql://');
    expect(blob).not.toContain('u:p@');
  });

  it('mentions hop in choose detail when free-tier hopped', () => {
    const events = toDataLiveWorkJourneyEvents(success({ hopped: true, fromProvider: 'supabase' }));
    const choose = events.find((e) => e.name.includes('neon') && e.phase === 'start');
    expect(choose?.detail).toMatch(/supabase/i);
  });
});

describe('toDataLiveWorkErrorEvent', () => {
  it('is error phase with safe code', () => {
    const event = toDataLiveWorkErrorEvent('ladder_exhausted', 'No path left');
    expect(event.phase).toBe('error');
    expect(event.detail).toContain('ladder_exhausted');
  });
});
