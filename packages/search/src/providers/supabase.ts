import { resolveDataProvider } from '@vybekiit/db';
import { Effect } from 'effect';
import { SearchError, type SearchDocument, type SearchHit, type SearchProvider } from '../types';

interface SearchRow {
  readonly id: string;
  readonly content: string;
}

/** Map a db failure into a {@link SearchError} with the given stable code. */
const asSearchError =
  (code: string) =>
  (error: { readonly message: string }): SearchError =>
    new SearchError({ code, message: error.message });

/**
 * Supabase-backed search over the Postgres data provider — indexes into a
 * `search_documents` table and does a case-insensitive `contains` scan. The db
 * seam is Effect-native (ADR-0023), so this composes its {@link Effect} directly and
 * maps the `DbError` channel to a {@link SearchError}.
 */
export function createSupabaseSearch(): SearchProvider {
  const data = resolveDataProvider();
  return {
    name: 'supabase',
    index(doc: SearchDocument) {
      return Effect.gen(function* () {
        const existing = yield* data.get<SearchRow>('search_documents', doc.id);
        if (existing) {
          yield* data.update<SearchRow>('search_documents', doc.id, { content: doc.content });
        } else {
          yield* data.insert<SearchRow>('search_documents', { id: doc.id, content: doc.content });
        }
        return true as const;
      }).pipe(Effect.mapError(asSearchError('search_index_failed')));
    },
    search(query: string, limit = 10) {
      return data.query<SearchRow>('search_documents', {}).pipe(
        Effect.map((rows) =>
          rows
            .filter((row) => row.content.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit)
            .map(
              (row): SearchHit => ({ id: row.id, score: 1, snippet: row.content.slice(0, 120) }),
            ),
        ),
        Effect.mapError(asSearchError('search_failed')),
      );
    },
    remove(id: string) {
      return data
        .remove('search_documents', id)
        .pipe(Effect.mapError(asSearchError('search_remove_failed')));
    },
  };
}
