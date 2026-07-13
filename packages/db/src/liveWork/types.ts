import { Data } from 'effect';

/**
 * Data adapters on the preference ladder (ADR-0039). Subset of {@link DataProviderName}
 * that Live work may try when the builder did not name a vendor.
 */
export type DataLadderProvider = 'supabase' | 'neon' | 'railway';

/**
 * Live work execution mode — drives mode-scoped teardown and Neon path
 * (claimable for demo/dogfood, account/existing for buyer).
 */
export type LiveWorkMode = 'demo' | 'dogfood' | 'buyer';

/**
 * Classified outcome of a ladder step failure (ADR-0039 hop allowlist).
 * Only `quota` and `onboarding_blocked` (and missing credentials as skip) continue the ladder.
 */
export type HopClass = 'quota' | 'onboarding_blocked' | 'missing_credentials' | 'hard_stop';

/**
 * Partial data resource left behind when the ladder hops or verify fails
 * (ADR-0039 best-effort orphan cleanup).
 */
export type OrphanHandle = {
  readonly provider: DataLadderProvider;
  readonly ephemeral: boolean;
  readonly claimableId?: string;
  /** Safe note for logs (never a secret / connection string). */
  readonly note?: string;
};

/**
 * Tagged failure for data Live work (ladder hop, provision, verify, pin).
 */
export class LiveWorkError extends Data.TaggedError('LiveWorkError')<{
  readonly code: string;
  readonly message: string;
  readonly hopClass: HopClass;
  readonly provider?: DataLadderProvider;
  /** When set, orchestrator best-effort cleans this resource on hop / fail. */
  readonly orphan?: OrphanHandle;
}> {}

/**
 * A provisioned data backend before pin — secrets never logged by the runner.
 */
export type ProvisionedData = {
  readonly provider: DataLadderProvider;
  readonly databaseUrl?: string;
  readonly claimUrl?: string;
  readonly claimableId?: string;
  /** When true, demo/dogfood may tear down after verify. */
  readonly ephemeral: boolean;
};

/**
 * Successful data Live work outcome (ADR-0039).
 */
export type DataLiveWorkResult = {
  readonly provider: DataLadderProvider;
  readonly databaseUrl?: string;
  readonly claimUrl?: string;
  readonly claimableId?: string;
  readonly ephemeral: boolean;
  readonly hopped: boolean;
  readonly fromProvider?: DataLadderProvider;
  readonly skipped: readonly DataLadderProvider[];
  readonly pin: Record<string, string>;
  readonly verified: true;
  /** Plain-language note for the builder (no env/API jargon). */
  readonly buyerMessage: string;
};

/**
 * Build {@link ProvisionedData} without writing `undefined` optional keys
 * (`exactOptionalPropertyTypes`).
 *
 * @param base - Required fields.
 * @param optional - Optional connection metadata when present.
 * @returns A clean provisioned snapshot.
 * @example
 * makeProvisioned({ provider: 'neon', ephemeral: true }, { databaseUrl: url });
 */
export const makeProvisioned = (
  base: { readonly provider: DataLadderProvider; readonly ephemeral: boolean },
  optional: {
    readonly databaseUrl?: string;
    readonly claimUrl?: string;
    readonly claimableId?: string;
  } = {},
): ProvisionedData => {
  const out: {
    provider: DataLadderProvider;
    ephemeral: boolean;
    databaseUrl?: string;
    claimUrl?: string;
    claimableId?: string;
  } = {
    provider: base.provider,
    ephemeral: base.ephemeral,
  };
  if (typeof optional.databaseUrl === 'string' && optional.databaseUrl.length > 0) {
    out.databaseUrl = optional.databaseUrl;
  }
  if (typeof optional.claimUrl === 'string' && optional.claimUrl.length > 0) {
    out.claimUrl = optional.claimUrl;
  }
  if (typeof optional.claimableId === 'string' && optional.claimableId.length > 0) {
    out.claimableId = optional.claimableId;
  }
  return out;
};
