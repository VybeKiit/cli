import { Data } from 'effect';

/**
 * Host adapters on the preference ladder (ADR-0039).
 * Order: cloudflare → render → railway → vercel → netlify → github-pages.
 */
export type HostLadderProvider =
  | 'cloudflare'
  | 'render'
  | 'railway'
  | 'vercel'
  | 'netlify'
  | 'github-pages';

/**
 * Live work execution mode — same as data concern (ADR-0039).
 */
export type LiveWorkMode = 'demo' | 'dogfood' | 'buyer';

/**
 * Classified outcome of a host ladder step failure.
 */
export type HopClass = 'quota' | 'onboarding_blocked' | 'missing_credentials' | 'hard_stop';

/**
 * Tagged failure for host Live work.
 */
export class HostLiveWorkError extends Data.TaggedError('HostLiveWorkError')<{
  readonly code: string;
  readonly message: string;
  readonly hopClass: HopClass;
  readonly provider?: HostLadderProvider;
}> {}

/**
 * Provisioned host before pin.
 */
export type ProvisionedHost = {
  readonly provider: HostLadderProvider;
  readonly url?: string;
  readonly projectId?: string;
  readonly ephemeral: boolean;
};

/**
 * Successful host Live work outcome.
 */
export type HostLiveWorkResult = {
  readonly provider: HostLadderProvider;
  readonly url?: string;
  readonly projectId?: string;
  readonly ephemeral: boolean;
  readonly hopped: boolean;
  readonly fromProvider?: HostLadderProvider;
  readonly skipped: readonly HostLadderProvider[];
  readonly pin: Record<string, string>;
  readonly verified: true;
  readonly buyerMessage: string;
};

/**
 * Build {@link ProvisionedHost} without writing undefined optionals.
 *
 * @param base - Required fields.
 * @param optional - Optional host metadata.
 * @returns Clean provisioned snapshot.
 * @example
 * makeProvisionedHost({ provider: 'cloudflare', ephemeral: false }, { url: 'https://x.pages.dev' });
 */
export const makeProvisionedHost = (
  base: { readonly provider: HostLadderProvider; readonly ephemeral: boolean },
  optional: { readonly url?: string; readonly projectId?: string } = {},
): ProvisionedHost => {
  const out: {
    provider: HostLadderProvider;
    ephemeral: boolean;
    url?: string;
    projectId?: string;
  } = {
    provider: base.provider,
    ephemeral: base.ephemeral,
  };
  if (typeof optional.url === 'string' && optional.url.length > 0) {
    out.url = optional.url;
  }
  if (typeof optional.projectId === 'string' && optional.projectId.length > 0) {
    out.projectId = optional.projectId;
  }
  return out;
};
