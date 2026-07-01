import { Data, type Effect } from 'effect';

export type SearchProviderName = 'supabase' | 'typesense' | 'algolia' | 'local';

export interface SearchDocument {
  readonly id: string;
  readonly content: string;
  readonly metadata?: Record<string, string> | undefined;
}

export interface SearchHit {
  readonly id: string;
  readonly score: number;
  readonly snippet: string;
}

/** The tagged failure a {@link SearchProvider} method can produce (ADR-0023). */
export class SearchError extends Data.TaggedError('SearchError')<{
  readonly code: string;
  readonly message: string;
}> {}

export interface SearchProvider {
  readonly name: SearchProviderName;
  index(doc: SearchDocument): Effect.Effect<true, SearchError>;
  search(
    query: string,
    limit?: number | undefined,
  ): Effect.Effect<readonly SearchHit[], SearchError>;
  remove(id: string): Effect.Effect<true, SearchError>;
}
