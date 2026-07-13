import type { Journey, JourneyToolEvent } from '@vybekiit/assistant-chat';
import { fixtureToolEvents } from '@vybekiit/assistant-chat';

const STEP_MS = 120;

/**
 * Play fixture tool events for offline / e2e demos.
 * Does not talk to a real agent; advances the journey rail only.
 * Applies all events on a short timer so Playwright can assert progress.
 *
 * @param journeys - Seeded journeys.
 * @param applyTool - Store apply callback.
 * @param onStart - Called when simulation starts.
 * @param onEnd - Called when simulation ends.
 * @returns Cancel function.
 * @example
 * const cancel = runJourneyFixtures(journeys, applyTool, setOn, setOff);
 */
export const runJourneyFixtures = (
  journeys: readonly Journey[],
  applyTool: (event: JourneyToolEvent) => void,
  onStart: () => void,
  onEnd: () => void,
): (() => void) => {
  const events: JourneyToolEvent[] = journeys.flatMap((j) => [...fixtureToolEvents(j)]);
  let index = 0;
  let cancelled = false;
  onStart();

  // Apply first event immediately so cards leave 0% without waiting a frame.
  const tick = () => {
    if (cancelled) {
      return;
    }
    const event = events[index];
    if (event === undefined) {
      onEnd();
      return;
    }
    applyTool(event);
    index += 1;
    if (index >= events.length) {
      onEnd();
      return;
    }
    timer = setTimeout(tick, STEP_MS);
  };

  let timer: ReturnType<typeof setTimeout> = setTimeout(tick, 0);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    onEnd();
  };
};

/**
 * True when local-dev should auto-play fixture tool streams (CI e2e / offline demo).
 * Real agent remains the production path; fixtures never log secrets.
 *
 * @param search - window.location.search or empty.
 * @param env - process.env-like map.
 * @returns Whether fixtures should run after seeding.
 * @example
 * shouldUseJourneyFixtures('?fixture=1', process.env) // true
 */
export const shouldUseJourneyFixtures = (
  search: string,
  env: Record<string, string | undefined>,
): boolean => {
  if (env.NEXT_PUBLIC_ASSISTANT_FIXTURE === '1') {
    return true;
  }
  if (env.PLAYWRIGHT === '1' || env.CI === 'true') {
    return true;
  }
  return search.includes('fixture=1');
};
