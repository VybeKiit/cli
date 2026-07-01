import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { resolveSearchProvider } from '../src/resolve';

describe('resolveSearchProvider', () => {
  it('uses local when supabase unconfigured', () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'supabase' });
    expect(search.name).toBe('local');
  });

  it('falls back to local for unshipped typesense provider', () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'typesense' });
    expect(search.name).toBe('local');
  });

  it('falls back to local for unshipped algolia provider', () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'algolia' });
    expect(search.name).toBe('local');
  });

  it('indexes and searches locally', async () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'local' });
    await Effect.runPromise(search.index({ id: '1', content: 'hello world' }));
    const value = await Effect.runPromise(search.search('hello'));
    expect(value.length).toBe(1);
  });
});
