import { applyPreset } from '@vybekiit/db/presets/apply';
import { getPreset, PRESET_CATALOG, PRESET_TABLE_NAMES } from '@vybekiit/db/presets/catalog';
import { renderPostgresPreset, renderPreset } from '@vybekiit/db/presets/render';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

type PresetManifest = NonNullable<ReturnType<typeof getPreset>>;

/**
 * Read a preset manifest and fail loudly when the catalog id is missing.
 *
 * @param id - Preset id to load.
 * @returns Preset manifest for the supplied id.
 * @example
 * const manifest = requirePreset('orders');
 */
const requirePreset = (id: string): PresetManifest => {
  const manifest = getPreset(id);
  if (manifest === undefined) {
    throw new Error(`Missing preset ${id}.`);
  }
  return manifest;
};

describe('preset catalog', () => {
  it('registers all full-catalog presets', () => {
    expect(Object.keys(PRESET_CATALOG).length).toBeGreaterThanOrEqual(22);
    expect(getPreset('orders')).toBeDefined();
    expect(getPreset('organizations')).toBeDefined();
    expect(getPreset('embeddings')).toBeDefined();
    expect(getPreset('products')).toBeDefined();
    expect(getPreset('cart')).toBeDefined();
    expect(getPreset('coupons')).toBeDefined();
    expect(getPreset('customers')).toBeDefined();
    expect(getPreset('pipeline')).toBeDefined();
    expect(getPreset('support_tickets')).toBeDefined();
    expect(getPreset('tasks')).toBeDefined();
    expect(getPreset('blog_posts')).toBeDefined();
    expect(getPreset('calendar_events')).toBeDefined();
  });

  it('includes preset table names for native Postgres routing', () => {
    expect(PRESET_TABLE_NAMES.has('orders')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('organization_members')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('products')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('cart_items')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('customers')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('deals')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('support_tickets')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('tasks')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('blog_posts')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('calendar_events')).toBe(true);
  });
});

describe('renderPostgresPreset', () => {
  it('renders orders with upsert index and RLS', () => {
    const manifest = requirePreset('orders');
    const sql = renderPostgresPreset(manifest, 'supabase');
    expect(sql).toContain('create table if not exists public.orders');
    expect(sql).toContain('order_id');
    expect(sql).toContain('enable row level security');
  });

  it('renders auth-bridge with is_admin helper', () => {
    const manifest = requirePreset('auth-bridge');
    const sql = renderPostgresPreset(manifest, 'supabase');
    expect(sql).toContain('is_admin');
    expect(sql).toContain('user_profiles');
  });

  it('renders nosql notes for mongodb', () => {
    const manifest = requirePreset('webhook_events');
    const rendered = renderPreset(manifest, 'mongodb');
    expect(rendered.nosqlNotes).toContain('webhook_events');
    expect(rendered.nosqlNotes).toContain('event_id');
    expect(rendered.nosqlNotes).toContain('stable apply plan');
  });

  it('renders nosql apply plan for orders with collections and index keys', () => {
    const manifest = requirePreset('orders');
    const rendered = renderPreset(manifest, 'mongodb');
    expect(rendered.nosqlNotes).toBeDefined();
    const notes = rendered.nosqlNotes ?? '';
    expect(notes).toContain('stable apply plan');
    expect(notes).toContain('"name": "orders"');
    expect(notes).toContain('order_id');
    expect(notes).toContain('"keys"');
    const plan = JSON.parse(notes) as {
      readonly collections: readonly {
        readonly name: string;
        readonly indexes: readonly unknown[];
      }[];
    };
    expect(plan.collections.some((collection) => collection.name === 'orders')).toBe(true);
    expect(plan.collections[0]?.indexes.length).toBeGreaterThan(0);
  });

  it('renders nosql apply plan for products with collection names and index keys', () => {
    const manifest = requirePreset('products');
    const mongo = renderPreset(manifest, 'mongodb');
    const firebase = renderPreset(manifest, 'firebase');
    const aws = renderPreset(manifest, 'aws');
    expect(mongo.nosqlNotes).toContain('products');
    expect(mongo.nosqlNotes).toContain('product_variants');
    expect(mongo.nosqlNotes).toContain('"keys"');
    expect(firebase.nosqlNotes).toContain('stable apply plan');
    expect(firebase.nosqlNotes).toContain('fieldPath');
    expect(firebase.nosqlNotes).toContain('COLLECTION');
    expect(aws.nosqlNotes).toContain('stable apply plan');
    expect(aws.nosqlNotes).toContain('HASH');
    expect(aws.nosqlNotes).toContain('globalSecondaryIndexes');
  });

  it('requests pgvector extension for embeddings', () => {
    const manifest = requirePreset('embeddings');
    const sql = renderPostgresPreset(manifest, 'neon');
    expect(sql).toContain('create extension if not exists vector');
    expect(sql).toContain('embedding vector');
    expect(sql).toContain('using hnsw (embedding vector_cosine_ops)');
  });

  it('renders products catalog with variants and user-owned RLS', () => {
    const manifest = requirePreset('products');
    const sql = renderPostgresPreset(manifest, 'supabase');
    expect(sql).toContain('create table if not exists public.products');
    expect(sql).toContain('create table if not exists public.product_variants');
    expect(sql).toContain('enable row level security');
  });

  it('renders customers CRM tables', () => {
    const manifest = requirePreset('customers');
    const sql = renderPostgresPreset(manifest, 'supabase');
    expect(sql).toContain('create table if not exists public.customers');
    expect(sql).toContain('create table if not exists public.customer_notes');
  });

  it('renders blog_posts with tags junction', () => {
    const manifest = requirePreset('blog_posts');
    const sql = renderPostgresPreset(manifest, 'neon');
    expect(sql).toContain('create table if not exists public.blog_posts');
    expect(sql).toContain('create table if not exists public.blog_post_tags');
  });

  it('omits Supabase authenticated policies on neon and railway', () => {
    const manifest = requirePreset('customers');
    const neonSql = renderPostgresPreset(manifest, 'neon');
    const railwaySql = renderPostgresPreset(manifest, 'railway');
    const supabaseSql = renderPostgresPreset(manifest, 'supabase');
    expect(neonSql).toContain('enable row level security');
    expect(neonSql).not.toContain('to authenticated');
    expect(neonSql).not.toContain('auth.uid()');
    expect(railwaySql).not.toContain('to authenticated');
    expect(supabaseSql).toContain('to authenticated');
  });
});

describe('applyPreset nosql dry-run', () => {
  it('applyPreset dry-run mongodb succeeds without network', async () => {
    const result = await Effect.runPromise(
      applyPreset({
        presetId: 'orders',
        provider: 'mongodb',
        databaseUrl: 'mongodb://localhost',
        dryRun: true,
      }),
    );
    expect(result.applied).toBe(false);
    expect(result.provider).toBe('mongodb');
    expect(result.nosqlNotes).toContain('stable apply plan');
    expect(result.nosqlNotes).toContain('orders');
    expect(result.nosqlNotes).toContain('order_id');
  });

  it('applyPreset dry-run firebase succeeds offline', async () => {
    const result = await Effect.runPromise(
      applyPreset({
        presetId: 'orders',
        provider: 'firebase',
        databaseUrl: '',
        dryRun: true,
      }),
    );
    expect(result.applied).toBe(false);
    expect(result.provider).toBe('firebase');
    expect(result.nosqlNotes).toContain('stable apply plan');
    expect(result.nosqlNotes).toContain('compositeIndexes');
  });

  it('applyPreset dry-run aws succeeds offline', async () => {
    const result = await Effect.runPromise(
      applyPreset({
        presetId: 'products',
        provider: 'aws',
        databaseUrl: '',
        dryRun: true,
      }),
    );
    expect(result.applied).toBe(false);
    expect(result.provider).toBe('aws');
    expect(result.nosqlNotes).toContain('stable apply plan');
    expect(result.nosqlNotes).toContain('products');
  });
});
