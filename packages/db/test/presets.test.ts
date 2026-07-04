import { getPreset, PRESET_CATALOG, PRESET_TABLE_NAMES } from '@vybekiit/db/presets/catalog';
import { renderPostgresPreset, renderPreset } from '@vybekiit/db/presets/render';
import { describe, expect, it } from 'vitest';

describe('preset catalog', () => {
  it('registers all full-catalog presets', () => {
    expect(Object.keys(PRESET_CATALOG).length).toBeGreaterThanOrEqual(13);
    expect(getPreset('orders')).toBeDefined();
    expect(getPreset('organizations')).toBeDefined();
    expect(getPreset('embeddings')).toBeDefined();
  });

  it('includes preset table names for native Postgres routing', () => {
    expect(PRESET_TABLE_NAMES.has('orders')).toBe(true);
    expect(PRESET_TABLE_NAMES.has('organization_members')).toBe(true);
  });
});

describe('renderPostgresPreset', () => {
  it('renders orders with upsert index and RLS', () => {
    const manifest = getPreset('orders');
    expect(manifest).toBeDefined();
    const sql = renderPostgresPreset(manifest!, 'supabase');
    expect(sql).toContain('create table if not exists public.orders');
    expect(sql).toContain('order_id');
    expect(sql).toContain('enable row level security');
  });

  it('renders auth-bridge with is_admin helper', () => {
    const manifest = getPreset('auth-bridge');
    const sql = renderPostgresPreset(manifest!, 'supabase');
    expect(sql).toContain('is_admin');
    expect(sql).toContain('user_profiles');
  });

  it('renders nosql notes for mongodb', () => {
    const manifest = getPreset('webhook_events');
    const rendered = renderPreset(manifest!, 'mongodb');
    expect(rendered.nosqlNotes).toContain('webhook_events');
    expect(rendered.nosqlNotes).toContain('event_id');
  });

  it('requests pgvector extension for embeddings', () => {
    const manifest = getPreset('embeddings');
    const sql = renderPostgresPreset(manifest!, 'neon');
    expect(sql).toContain('create extension if not exists vector');
    expect(sql).toContain('embedding vector');
  });
});
