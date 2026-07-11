import { resolveDataProvider } from '@vybekiit/db';
import { Effect } from 'effect';
import { type SearchDocument, SearchError, type SearchHit, type SearchProvider } from '../types';

const defaultSearchLimit = 10;
const snippetLength = 120;

type SearchRow = {
  readonly id: string;
  readonly content: string;
};

/**
 * Map a db failure into a {@link SearchError} with a stable code.
 *
 * @param code - Stable search error code.
 * @returns A mapper from db-like failures to SearchError.
 * @example
 * const mapError = asSearchError('search_failed');
 */
const asSearchError =
  (code: SearchError['code']) =>
  (error: { readonly message: string }): SearchError =>
    new SearchError({ code, message: error.message });

/**
 * Build the Supabase-backed search adapter over the data provider.
 *
 * @returns A search provider that indexes and scans `search_documents`.
 * @example
 * const search = createSupabaseSearch();
 */
export const createSupabaseSearch = (): SearchProvider => {
  const data = resolveDataProvider();
  return {
    name: 'supabase',
    index: (doc: SearchDocument) =>
      Effect.gen(function* () {
        const existing = yield* data.get<SearchRow>('search_documents', doc.id);
        if (existing === null) {
          yield* data.insert<SearchRow>('search_documents', { id: doc.id, content: doc.content });
        } else {
          yield* data.update<SearchRow>('search_documents', doc.id, { content: doc.content });
        }
        return true as const;
      }).pipe(Effect.mapError(asSearchError('search_index_failed'))),
    search: (query: string, limit = defaultSearchLimit) =>
      data.query<SearchRow>('search_documents', {}).pipe(
        Effect.map((rows) =>
          rows
            .filter((row) => row.content.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit)
            .map(
              (row): SearchHit => ({
                id: row.id,
                score: 1,
                snippet: row.content.slice(0, snippetLength),
              }),
            ),
        ),
        Effect.mapError(asSearchError('search_failed')),
      ),
    remove: (id: string) =>
      data
        .remove('search_documents', id)
        .pipe(Effect.mapError(asSearchError('search_remove_failed'))),
  };
};
