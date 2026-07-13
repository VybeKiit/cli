import { describe, expect, it } from 'vitest';
import { applyToolEvents } from './matchToolEvents';
import { seedJourney } from './seedJourney';

/**
 * Mirror of `@vybekiit/db` toDataLiveWorkJourneyEvents (keep in sync when names change).
 * Avoids a reverse package dependency for this contract test.
 */
const dataLiveWorkEvents = (provider: string) => {
  const pair = (name: string, detail: string) => [
    { name, phase: 'start' as const, detail },
    { name, phase: 'end' as const, detail: `${detail} done` },
  ];
  return [
    ...pair(`live-work.database.${provider}`, `Pick where data lives: ${provider}`),
    ...pair('live-work.database.schema', 'Design what to remember'),
    ...pair('live-work.database.connect', 'Connect the app'),
    ...pair('live-work.database.health', 'Ready-feature check'),
    ...pair('live-work.database.verify', 'Save and read back'),
  ];
};

describe('Live work data events ↔ database journey', () => {
  it('advances every database step to done', () => {
    const journey = seedJourney('database', { provider: 'neon' });
    const done = applyToolEvents(journey, dataLiveWorkEvents('neon'));
    expect(done.steps.every((step) => step.status === 'done')).toBe(true);
  });
});
