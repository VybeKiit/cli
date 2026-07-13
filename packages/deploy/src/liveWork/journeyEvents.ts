import type { HostLiveWorkResult } from './types';

/**
 * Tool event shape consumed by the local-dev journey rail
 * (`@vybekiit/assistant-chat` JourneyToolEvent). Kept structural so `@vybekiit/deploy`
 * does not depend on the UI package.
 */
export type HostLiveWorkToolEvent = {
  readonly name: string;
  readonly phase: 'start' | 'end' | 'error';
  readonly detail?: string;
};

/**
 * Map a successful host Live work result to ordered rail tool events.
 * Names include substrings from deploy journey `toolHints` so steps advance
 * without fixture animation (ADR-0039 execution cascade → journey events).
 *
 * @param result - Verified Live work success (public fields only are used).
 * @returns start/end pairs for choose → publish → ready → verify.
 * @example
 * toHostLiveWorkJourneyEvents(result).every((e) => e.phase === 'start' || e.phase === 'end');
 */
export const toHostLiveWorkJourneyEvents = (
  result: HostLiveWorkResult,
): readonly HostLiveWorkToolEvent[] => {
  const brand = result.provider;
  const hopNote =
    result.hopped && result.fromProvider !== undefined
      ? ` (switched from ${result.fromProvider})`
      : '';

  const pair = (name: string, detail: string): readonly HostLiveWorkToolEvent[] => [
    { name, phase: 'start', detail },
    { name, phase: 'end', detail: `${detail} done` },
  ];

  return [
    ...pair(`live-work.deploy.${brand}`, `Pick where the app lives: ${brand}${hopNote}`),
    ...pair('live-work.deploy.publish', 'Publish the app online'),
    ...pair('live-work.deploy.health', 'Ready-check the live address'),
    ...pair(
      'live-work.deploy.verify',
      result.buyerMessage.length > 0 ? result.buyerMessage : 'Live URL opens',
    ),
  ];
};

/**
 * Single error tool event when host Live work fails (rail shows error step).
 *
 * @param code - Stable failure code.
 * @param message - Safe message (never a secret).
 * @returns One error-phase event matching deploy toolHints.
 * @example
 * toHostLiveWorkErrorEvent('ladder_exhausted', 'No free host path worked');
 */
export const toHostLiveWorkErrorEvent = (code: string, message: string): HostLiveWorkToolEvent => ({
  name: 'live-work.deploy.health',
  phase: 'error',
  detail: `${code}: ${message}`,
});
