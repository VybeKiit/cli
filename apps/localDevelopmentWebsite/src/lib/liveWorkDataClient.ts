/**
 * Browser client for real data Live work (ADR-0039).
 * Calls the Next API route; never receives DATABASE_URL secrets.
 */

export type LiveWorkDataApiSuccess = {
  readonly ok: true;
  readonly provider: string;
  readonly ephemeral: boolean;
  readonly hopped: boolean;
  readonly fromProvider?: string;
  readonly skipped: readonly string[];
  readonly verified: true;
  readonly buyerMessage: string;
  readonly pinKeys: readonly string[];
  readonly pinned: boolean;
  readonly claimUrl?: string;
  readonly claimableId?: string;
  readonly events: readonly {
    readonly name: string;
    readonly phase: 'start' | 'end' | 'error';
    readonly detail?: string;
  }[];
};

export type LiveWorkDataApiFailure = {
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

export type LiveWorkDataApiResult = LiveWorkDataApiSuccess | LiveWorkDataApiFailure;

/**
 * POST real data Live work to the local console API.
 *
 * @param options - Mode and optional named vendor stick.
 * @returns Public JSON (no connection secrets).
 * @example
 * const result = await postLiveWorkData({ mode: 'demo', vendor: 'neon' });
 */
export const postLiveWorkData = async (options: {
  readonly mode?: 'demo' | 'dogfood' | 'buyer';
  readonly vendor?: 'supabase' | 'neon' | 'railway';
  readonly fresh?: boolean;
}): Promise<LiveWorkDataApiResult> => {
  const response = await fetch('/api/live-work/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: options.mode ?? 'demo',
      ...(options.vendor === undefined ? {} : { vendor: options.vendor }),
      fresh: options.fresh === true,
    }),
  });

  const body = (await response.json()) as LiveWorkDataApiResult;
  return body;
};

/**
 * Whether the console should call the real Live work API instead of fixtures.
 * Opt-in only so Playwright / offline demos stay secret-free (ADR-0039).
 *
 * @param search - window.location.search.
 * @param env - process.env-like map (NEXT_PUBLIC_* only on client).
 * @returns True when live data path is requested.
 * @example
 * shouldUseLiveWorkData('?live=1', {}) // true
 */
export const shouldUseLiveWorkData = (
  search: string,
  env: Record<string, string | undefined>,
): boolean => {
  if (env.NEXT_PUBLIC_LIVE_WORK === '1') {
    return true;
  }
  return search.includes('live=1') || search.includes('live=true');
};
