import type { JourneyToolEvent } from '@vybekiit/assistant-chat';

const STEP_MS = 100;

/**
 * Play real Live work tool events on a short timer (same shape as fixtures).
 *
 * @param events - Events from POST /api/live-work/data.
 * @param applyTool - Rail apply callback.
 * @param onStart - Called when playback starts.
 * @param onEnd - Called when playback ends.
 * @returns Cancel function.
 * @example
 * const cancel = runLiveWorkDataEvents(events, applyTool, start, end);
 */
export const runLiveWorkDataEvents = (
  events: readonly JourneyToolEvent[],
  applyTool: (event: JourneyToolEvent) => void,
  onStart: () => void,
  onEnd: () => void,
): (() => void) => {
  let index = 0;
  let cancelled = false;
  onStart();

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
 * Lowercase scenario id + brand tokens for vendor matching.
 *
 * @param scenarioId - Openable scenario id.
 * @param brands - Scenario brand tokens.
 * @returns Search haystack.
 */
const scenarioHaystack = (scenarioId: string, brands: readonly string[]): string =>
  `${scenarioId} ${brands.join(' ')}`.toLowerCase();

/**
 * Map scenario id / brands to a data ladder vendor for named stick.
 *
 * @param scenarioId - Openable scenario id.
 * @param brands - Scenario brand tokens.
 * @returns Ladder vendor or undefined for full ladder.
 * @example
 * vendorFromScenario('neon', ['neon']) // 'neon'
 */
export const vendorFromScenario = (
  scenarioId: string,
  brands: readonly string[],
): 'supabase' | 'neon' | 'railway' | undefined => {
  const haystack = scenarioHaystack(scenarioId, brands);
  if (haystack.includes('supabase')) {
    return 'supabase';
  }
  if (haystack.includes('neon')) {
    return 'neon';
  }
  if (haystack.includes('railway')) {
    return 'railway';
  }
  return undefined;
};

/**
 * Map scenario id / brands to a payments ladder vendor for named stick.
 *
 * @param scenarioId - Openable scenario id.
 * @param brands - Scenario brand tokens.
 * @returns Payments vendor or undefined for full ladder.
 * @example
 * paymentsVendorFromScenario('stripe', ['stripe']) // 'stripe'
 */
export const paymentsVendorFromScenario = (
  scenarioId: string,
  brands: readonly string[],
): 'lemon-squeezy' | 'stripe' | 'paypal' | undefined => {
  const haystack = scenarioHaystack(scenarioId, brands);
  if (haystack.includes('paypal')) {
    return 'paypal';
  }
  if (haystack.includes('lemon')) {
    return 'lemon-squeezy';
  }
  if (haystack.includes('stripe')) {
    return 'stripe';
  }
  return undefined;
};

/**
 * Map scenario id / brands to a host ladder vendor for named stick.
 *
 * @param scenarioId - Openable scenario id.
 * @param brands - Scenario brand tokens.
 * @returns Host vendor or undefined for full ladder.
 * @example
 * hostVendorFromScenario('cloudflare', ['cloudflare']) // 'cloudflare'
 */
export const hostVendorFromScenario = (
  scenarioId: string,
  brands: readonly string[],
): 'cloudflare' | 'render' | 'railway' | 'vercel' | undefined => {
  const haystack = scenarioHaystack(scenarioId, brands);
  if (haystack.includes('vercel')) {
    return 'vercel';
  }
  if (haystack.includes('render')) {
    return 'render';
  }
  if (haystack.includes('railway')) {
    return 'railway';
  }
  if (haystack.includes('cloudflare')) {
    return 'cloudflare';
  }
  return undefined;
};
