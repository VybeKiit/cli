import type { PaymentsLiveWorkResult } from './types';

/**
 * Tool event shape consumed by the local-dev journey rail
 * (`@vybekiit/assistant-chat` JourneyToolEvent). Kept structural so
 * `@vybekiit/payments` does not depend on the UI package.
 */
export type PaymentsLiveWorkToolEvent = {
  readonly name: string;
  readonly phase: 'start' | 'end' | 'error';
  readonly detail?: string;
};

/**
 * Map a successful payments Live work result to ordered rail tool events.
 * Names include substrings from payments journey `toolHints` so steps advance
 * without fixture animation (ADR-0039 execution cascade → journey events).
 *
 * @param result - Verified Live work success (public fields only).
 * @returns start/end pairs for choose → keys → verify.
 * @example
 * toPaymentsLiveWorkJourneyEvents(result).every((e) => e.phase === 'start' || e.phase === 'end');
 */
export const toPaymentsLiveWorkJourneyEvents = (
  result: PaymentsLiveWorkResult,
): readonly PaymentsLiveWorkToolEvent[] => {
  const brand = result.provider;
  const hopNote =
    result.hopped && result.fromProvider !== undefined
      ? ` (switched from ${result.fromProvider})`
      : '';

  const pair = (name: string, detail: string): readonly PaymentsLiveWorkToolEvent[] => [
    { name, phase: 'start', detail },
    { name, phase: 'end', detail: `${detail} done` },
  ];

  return [
    ...pair(`live-work.payments.${brand}`, `Pick how to take money: ${brand}${hopNote}`),
    ...pair('live-work.payments.keys', 'Connect payment keys'),
    ...pair(
      'live-work.payments.verify',
      result.buyerMessage.length > 0 ? result.buyerMessage : 'Payments ready',
    ),
  ];
};

/**
 * Single error tool event when payments Live work fails.
 *
 * @param code - Stable failure code.
 * @param message - Safe message (never a secret).
 * @returns One error-phase event.
 * @example
 * toPaymentsLiveWorkErrorEvent('ladder_exhausted', 'No free payments path worked');
 */
export const toPaymentsLiveWorkErrorEvent = (
  code: string,
  message: string,
): PaymentsLiveWorkToolEvent => ({
  name: 'live-work.payments.verify',
  phase: 'error',
  detail: `${code}: ${message}`,
});
