import type { DataLiveWorkResult } from './types';

/**
 * Tool event shape consumed by the local-dev journey rail
 * (`@vybekiit/assistant-chat` JourneyToolEvent). Kept structural so `@vybekiit/db`
 * does not depend on the UI package.
 */
export type DataLiveWorkToolEvent = {
  readonly name: string;
  readonly phase: 'start' | 'end' | 'error';
  readonly detail?: string;
};

/**
 * Map a successful data Live work result to ordered rail tool events.
 * Names include substrings from database journey `toolHints` so steps advance
 * without fixture animation (ADR-0039 execution cascade → journey events).
 *
 * @param result - Verified Live work success (public fields only are used).
 * @returns start/end pairs for choose → wire → ready → verify.
 * @example
 * toDataLiveWorkJourneyEvents(result).every((e) => e.phase === 'start' || e.phase === 'end');
 */
export const toDataLiveWorkJourneyEvents = (
  result: DataLiveWorkResult,
): readonly DataLiveWorkToolEvent[] => {
  const brand = result.provider;
  const hopNote =
    result.hopped && result.fromProvider !== undefined
      ? ` (switched from ${result.fromProvider})`
      : '';

  const pair = (name: string, detail: string): readonly DataLiveWorkToolEvent[] => [
    { name, phase: 'start', detail },
    { name, phase: 'end', detail: `${detail} done` },
  ];

  return [
    ...pair(`live-work.database.${brand}`, `Pick where data lives: ${brand}${hopNote}`),
    ...pair('live-work.database.schema', 'Design what to remember'),
    ...pair('live-work.database.connect', 'Connect the app (keys stay private)'),
    ...pair('live-work.database.health', 'Ready-feature check'),
    ...pair(
      'live-work.database.verify',
      result.buyerMessage.length > 0 ? result.buyerMessage : 'Save and read back',
    ),
  ];
};

/**
 * Single error tool event when data Live work fails (rail shows error step).
 *
 * @param code - Stable failure code.
 * @param message - Safe message (never a secret).
 * @returns One error-phase event matching database toolHints.
 * @example
 * toDataLiveWorkErrorEvent('ladder_exhausted', 'No free database path worked');
 */
export const toDataLiveWorkErrorEvent = (code: string, message: string): DataLiveWorkToolEvent => ({
  name: 'live-work.database.health',
  phase: 'error',
  detail: `${code}: ${message}`,
});
