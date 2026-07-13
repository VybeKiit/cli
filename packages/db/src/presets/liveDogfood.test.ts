import { neon } from '@neondatabase/serverless';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { createClaimableNeon } from '../liveWork/claimableNeon';
import { applyPreset, applyPresets } from './apply';
import { ALL_PRESETS } from './catalog';
import { verifyPresets } from './verify';

/**
 * Live dogfood against a real Postgres URL.
 * Enable with DOGFOOD_LIVE=1 (provisions claimable Neon via Live work SSOT)
 * or DATABASE_URL. Skipped in default CI so unit gate stays offline.
 */
const shouldRunLive =
  process.env.DOGFOOD_LIVE === '1' ||
  (typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0);

const SAAS_CORE = [
  'orders',
  'customers',
  'products',
  'organizations',
  'webhook_events',
  'auth-bridge',
  'feature_flags',
  'audit_log',
] as const;

/**
 * Resolve a throwaway Postgres URL: existing DATABASE_URL or claimable Neon.
 *
 * @returns Connection string for the test process only (never log).
 */
const resolveDatabaseUrl = async (): Promise<string> => {
  const existing = process.env.DATABASE_URL;
  if (typeof existing === 'string' && existing.length > 0) {
    return existing;
  }
  const provisioned = await Effect.runPromise(
    createClaimableNeon({ ref: 'vybekiit-dogfood-presets' }),
  );
  if (typeof provisioned.databaseUrl !== 'string' || provisioned.databaseUrl.length === 0) {
    throw new Error('claimable Neon returned no databaseUrl');
  }
  return provisioned.databaseUrl;
};

describe.skipIf(!shouldRunLive)('live dogfood presets (real Postgres)', () => {
  it('applies SaaS core + CRUD ready-check on claimable Neon', async () => {
    const databaseUrl = await resolveDatabaseUrl();
    const applied = await Effect.runPromise(
      applyPresets([...SAAS_CORE], 'neon', databaseUrl, false),
    );
    expect(applied).toHaveLength(SAAS_CORE.length);
    for (const row of applied) {
      expect(row.applied).toBe(true);
    }

    const verification = await Effect.runPromise(verifyPresets([...SAAS_CORE], databaseUrl));
    expect(verification.ok).toBe(true);

    const sql = neon(databaseUrl);
    const orderId = `live-dogfood-${Date.now()}`;
    await sql`insert into public.orders (order_id, email, refunded, revoked)
        values (${orderId}, ${'live@example.com'}, false, false)`;
    const rows = await sql`select order_id, email from public.orders where order_id = ${orderId}`;
    expect(rows).toHaveLength(1);
    await sql`update public.orders set refunded = true where order_id = ${orderId}`;
    await sql`delete from public.orders where order_id = ${orderId}`;
    const gone = await sql`select 1 from public.orders where order_id = ${orderId}`;
    expect(gone).toHaveLength(0);
  }, 120_000);

  it('applies every catalog preset for neon', async () => {
    const databaseUrl = await resolveDatabaseUrl();
    for (const preset of ALL_PRESETS) {
      const result = await Effect.runPromise(
        applyPreset({
          presetId: preset.id,
          provider: 'neon',
          databaseUrl,
          dryRun: false,
        }),
      );
      expect(result.applied).toBe(true);
    }
    const verification = await Effect.runPromise(
      verifyPresets(
        ALL_PRESETS.map((p) => p.id),
        databaseUrl,
      ),
    );
    expect(verification.ok).toBe(true);
  }, 180_000);
});
