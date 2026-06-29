import { describe, expect, it } from 'vitest';
import { resolveSearchProvider } from '../src/resolve';

describe('resolveSearchProvider', () => {
  it('uses local when supabase unconfigured', () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'supabase' });
    expect(search.name).toBe('local');
  });

  it('indexes and searches locally', async () => {
    const search = resolveSearchProvider({ SEARCH_PROVIDER: 'local' });
    await search.index({ id: '1', content: 'hello world' });
    const result = await search.search('hello');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.length).toBe(1);
  });
});
