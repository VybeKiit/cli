import { neon } from '@neondatabase/serverless';
import { Effect } from 'effect';
import { LiveWorkError, makeProvisioned, type ProvisionedData } from './types';

const CLAIMABLE_API = 'https://neon.new/api/v1/database';

/** JSON body returned by neon.new create/status. */
type ClaimableApiBody = {
  readonly id?: string;
  readonly connection_string?: string | null;
  readonly claim_url?: string;
  readonly status?: string;
};

/**
 * Options for claimable Neon create.
 */
export type CreateClaimableNeonOptions = {
  /** Tracking tag for neon.new (`ref` field). */
  readonly ref: string;
  /** Optional fetch for tests. */
  readonly fetchImpl?: typeof fetch;
};

/**
 * Provision a throwaway claimable Neon database (neon.new) — demo/dogfood path (ADR-0039).
 * No account required; unclaimed DBs expire (~72h).
 *
 * @param options - Referrer tag and optional fetch.
 * @returns Effect of provisioned neon data (ephemeral).
 * @example
 * const db = await Effect.runPromise(createClaimableNeon({ ref: 'vybekiit-live-work' }));
 */
export const createClaimableNeon = (
  options: CreateClaimableNeonOptions,
): Effect.Effect<ProvisionedData, LiveWorkError> =>
  Effect.tryPromise({
    try: async () => {
      const fetchImpl = options.fetchImpl ?? globalThis.fetch;
      const response = await fetchImpl(CLAIMABLE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: options.ref }),
      });
      const body = (await response.json()) as ClaimableApiBody;

      if (!response.ok) {
        const message = JSON.stringify(body);
        throw Object.assign(new Error(message), {
          status: response.status,
          body,
        });
      }

      const connectionString = body.connection_string;
      if (typeof connectionString !== 'string' || connectionString.length === 0) {
        throw new Error('Claimable Neon response missing connection_string');
      }

      const optional: {
        databaseUrl: string;
        claimUrl?: string;
        claimableId?: string;
      } = { databaseUrl: connectionString };
      if (typeof body.claim_url === 'string') {
        optional.claimUrl = body.claim_url;
      }
      if (typeof body.id === 'string') {
        optional.claimableId = body.id;
      }
      return makeProvisioned({ provider: 'neon', ephemeral: true }, optional);
    },
    catch: (cause) => mapClaimableFailure(cause),
  });

/**
 * True when the URL is a Neon-hosted database (HTTP serverless driver works).
 *
 * @param databaseUrl - Connection string.
 * @returns Whether to use `@neondatabase/serverless`.
 */
const isNeonHostedUrl = (databaseUrl: string): boolean =>
  /neon\.tech|neon\.build|neon\.db|neon\.app/i.test(databaseUrl);

/**
 * Verify a Postgres URL with `SELECT 1`.
 * Neon URLs use the serverless driver; Railway and other TCP hosts use `pg`.
 *
 * @param databaseUrl - Connection string to probe (never logged).
 * @returns Effect that succeeds when the database answers.
 * @example
 * await Effect.runPromise(verifyDatabaseUrl(url));
 */
export const verifyDatabaseUrl = (databaseUrl: string): Effect.Effect<true, LiveWorkError> =>
  Effect.tryPromise({
    try: async () => {
      if (isNeonHostedUrl(databaseUrl)) {
        const sql = neon(databaseUrl);
        await sql`SELECT 1 AS ok`;
        return true as const;
      }

      // Railway public proxy and other TCP Postgres (not Neon HTTP).
      const { default: pg } = await import('pg');
      const client = new pg.Client({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 20_000,
      });
      try {
        await client.connect();
        await client.query('SELECT 1 AS ok');
        return true as const;
      } finally {
        await client.end().catch(() => undefined);
      }
    },
    catch: (cause) =>
      new LiveWorkError({
        code: 'verify_failed',
        message: cause instanceof Error ? cause.message : 'Database verify failed',
        hopClass: 'hard_stop',
        provider: 'neon',
      }),
  });

/**
 * Map neon.new / network failures into hop-classed {@link LiveWorkError}.
 *
 * @param cause - Thrown value from fetch/parse.
 * @returns Classified Live work error.
 */
const mapClaimableFailure = (cause: unknown): LiveWorkError => {
  const message = cause instanceof Error ? cause.message : 'Claimable Neon create failed';
  const status =
    typeof cause === 'object' &&
    cause !== null &&
    'status' in cause &&
    typeof (cause as { status: unknown }).status === 'number'
      ? (cause as { status: number }).status
      : undefined;

  const lower = message.toLowerCase();
  if (
    status === 429 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('limit')
  ) {
    return new LiveWorkError({
      code: 'quota_exceeded',
      message,
      hopClass: 'quota',
      provider: 'neon',
    });
  }

  return new LiveWorkError({
    code: 'claimable_create_failed',
    message,
    hopClass: 'hard_stop',
    provider: 'neon',
  });
};
