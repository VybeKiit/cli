/**
 * Browser client for real payments Live work (ADR-0039).
 * Calls the Next API route; never receives payment API secrets.
 */

export type LiveWorkPaymentsApiSuccess = {
  readonly ok: true;
  readonly provider: string;
  readonly ephemeral: false;
  readonly hopped: boolean;
  readonly fromProvider?: string;
  readonly skipped: readonly string[];
  readonly verified: true;
  readonly buyerMessage: string;
  readonly pinKeys: readonly string[];
  readonly pinned: boolean;
  readonly events: readonly {
    readonly name: string;
    readonly phase: 'start' | 'end' | 'error';
    readonly detail?: string;
  }[];
};

export type LiveWorkPaymentsApiFailure = {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
  readonly hopClass?: string;
  readonly provider?: string;
  readonly events: readonly {
    readonly name: string;
    readonly phase: 'start' | 'end' | 'error';
    readonly detail?: string;
  }[];
};

export type LiveWorkPaymentsApiResult = LiveWorkPaymentsApiSuccess | LiveWorkPaymentsApiFailure;

/**
 * POST real payments Live work to the local console API.
 *
 * @param options - Mode and optional named vendor stick.
 * @returns Public JSON (no API secrets).
 * @example
 * const result = await postLiveWorkPayments({ mode: 'demo', vendor: 'stripe' });
 */
export const postLiveWorkPayments = async (options: {
  readonly mode?: 'demo' | 'dogfood' | 'buyer';
  readonly vendor?: 'lemon-squeezy' | 'stripe' | 'paypal';
  readonly fresh?: boolean;
}): Promise<LiveWorkPaymentsApiResult> => {
  const response = await fetch('/api/live-work/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: options.mode ?? 'demo',
      ...(options.vendor === undefined ? {} : { vendor: options.vendor }),
      fresh: options.fresh === true,
    }),
  });

  const body = (await response.json()) as LiveWorkPaymentsApiResult;
  return body;
};

/**
 * Whether the console should call the real payments Live work API instead of fixtures.
 * Shares the same opt-in as data/host Live work (ADR-0039).
 *
 * @param search - window.location.search.
 * @param env - process.env-like map (NEXT_PUBLIC_* only on client).
 * @returns True when live payments path is requested.
 * @example
 * shouldUseLiveWorkPayments('?live=1', {}) // true
 */
export const shouldUseLiveWorkPayments = (
  search: string,
  env: Record<string, string | undefined>,
): boolean => {
  if (env.NEXT_PUBLIC_LIVE_WORK === '1') {
    return true;
  }
  return search.includes('live=1') || search.includes('live=true');
};
