/**
 * Browser client for real host Live work (ADR-0039).
 * Calls the Next API route; never receives host API tokens.
 */

export type LiveWorkHostApiSuccess = {
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
  readonly tornDown?: boolean;
  readonly url?: string;
  readonly events: readonly {
    readonly name: string;
    readonly phase: 'start' | 'end' | 'error';
    readonly detail?: string;
  }[];
};

export type LiveWorkHostApiFailure = {
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

export type LiveWorkHostApiResult = LiveWorkHostApiSuccess | LiveWorkHostApiFailure;

/**
 * POST real host Live work to the local console API.
 *
 * @param options - Mode and optional named vendor stick.
 * @returns Public JSON (no API tokens).
 * @example
 * const result = await postLiveWorkHost({ mode: 'demo', vendor: 'cloudflare' });
 */
export const postLiveWorkHost = async (options: {
  readonly mode?: 'demo' | 'dogfood' | 'buyer';
  readonly vendor?: 'cloudflare' | 'render' | 'railway' | 'vercel';
  readonly fresh?: boolean;
}): Promise<LiveWorkHostApiResult> => {
  const response = await fetch('/api/live-work/host', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: options.mode ?? 'demo',
      ...(options.vendor === undefined ? {} : { vendor: options.vendor }),
      fresh: options.fresh === true,
    }),
  });

  const body = (await response.json()) as LiveWorkHostApiResult;
  return body;
};

/**
 * Whether the console should call the real host Live work API instead of fixtures.
 * Shares the same opt-in as data Live work (ADR-0039).
 *
 * @param search - window.location.search.
 * @param env - process.env-like map (NEXT_PUBLIC_* only on client).
 * @returns True when live host path is requested.
 * @example
 * shouldUseLiveWorkHost('?live=1', {}) // true
 */
export const shouldUseLiveWorkHost = (
  search: string,
  env: Record<string, string | undefined>,
): boolean => {
  if (env.NEXT_PUBLIC_LIVE_WORK === '1') {
    return true;
  }
  return search.includes('live=1') || search.includes('live=true');
};
