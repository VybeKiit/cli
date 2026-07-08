import { it } from '@effect/vitest';
import { resolveSearchProvider, resolveSearchService } from '@vybekiit/search/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveSearchProvider', () => {
  it('uses local when supabase unconfigured', () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'supabase' });
    expect(search.name).toBe('local');
  });

  it('indexes and searches locally', async () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'local' });
    await Effect.runPromise(search.index({ id: '1', content: 'hello world' }));
    const value = await Effect.runPromise(search.search('hello'));
    expect(value.length).toBe(1);
  });
});

describe('resolveSearchService', () => {
  it.effect('fails loud for the unshipped typesense adapter', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveSearchService({ SEARCH_PROVIDER: 'typesense' }));
      expect(error.code).toBe('SEARCH_PROVIDER_UNSUPPORTED');
      expect(error.message).toContain('typesense');
    }),
  );

  it.effect('fails loud for the unshipped algolia adapter', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveSearchService({ SEARCH_PROVIDER: 'algolia' }));
      expect(error.code).toBe('SEARCH_PROVIDER_UNSUPPORTED');
      expect(error.message).toContain('algolia');
    }),
  );
});
