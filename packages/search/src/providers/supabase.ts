import { resolveDataProvider } from '@vybekiit/db';
import { fail, ok, type Result } from '@vybekiit/core';
import type { SearchDocument, SearchHit, SearchProvider } from '../types';

interface SearchRow {
  readonly id: string;
  readonly content: string;
}

export function createSupabaseSearch(): SearchProvider {
  const data = resolveDataProvider();
  return {
    name: 'supabase',
    async index(doc: SearchDocument): Promise<Result<true>> {
      const existing = await data.get<SearchRow>('search_documents', doc.id);
      if (existing.ok && existing.value) {
        const updated = await data.update<SearchRow>('search_documents', doc.id, {
          content: doc.content,
        });
        if (!updated.ok) return fail('search_index_failed', updated.error.message);
        return ok(true);
      }
      const inserted = await data.insert<SearchRow>('search_documents', {
        id: doc.id,
        content: doc.content,
      });
      if (!inserted.ok) return fail('search_index_failed', inserted.error.message);
      return ok(true);
    },
    async search(query: string, limit = 10): Promise<Result<readonly SearchHit[]>> {
      const result = await data.query<SearchRow>('search_documents', {});
      if (!result.ok) return fail('search_failed', result.error.message);
      const hits: SearchHit[] = result.value
        .filter((row) => row.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map((row) => ({ id: row.id, score: 1, snippet: row.content.slice(0, 120) }));
      return ok(hits);
    },
    async remove(id: string): Promise<Result<true>> {
      return data.remove('search_documents', id);
    },
  };
}
