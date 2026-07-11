import { Data, type Effect, Schema } from 'effect';

/** Provider keys accepted by the search resolver. */
export const SearchProviderName = Schema.Literal('supabase', 'typesense', 'algolia', 'local');

/** Static type inferred from {@link SearchProviderName}. */
export type SearchProviderNameType = Schema.Schema.Type<typeof SearchProviderName>;

/** Normalized search hit returned by provider adapters. */
export const SearchHit = Schema.Struct({
  id: Schema.String,
  score: Schema.Number,
  snippet: Schema.String,
});

/** Static type inferred from {@link SearchHit}. */
export type SearchHitType = Schema.Schema.Type<typeof SearchHit>;

/** Search document indexed by provider adapters. */
export const SearchDocument = Schema.Struct({
  id: Schema.String,
  content: Schema.String,
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
});

/** Static type inferred from {@link SearchDocument}. */
export type SearchDocumentType = Schema.Schema.Type<typeof SearchDocument>;

/** Provider keys accepted by the search resolver. */
export type SearchProviderName = SearchProviderNameType;

/** Search document indexed by provider adapters. */
export type SearchDocument = SearchDocumentType;

/** Normalized search hit returned by provider adapters. */
export type SearchHit = SearchHitType;

/** Stable tagged failure codes for search package operations. */
export type SearchErrorCode =
  | 'SEARCH_CONFIG_INVALID'
  | 'SEARCH_PROVIDER_UNSUPPORTED'
  | 'search_index_failed'
  | 'search_failed'
  | 'search_remove_failed';

/** The tagged failure a {@link SearchProvider} method can produce (ADR-0023). */
export class SearchError extends Data.TaggedError('SearchError')<{
  readonly code: SearchErrorCode;
  readonly message: string;
}> {}

/** Effect service contract implemented by each search adapter. */
export type SearchService = {
  readonly name: SearchProviderName;
  readonly index: (doc: SearchDocument) => Effect.Effect<true, SearchError>;
  readonly search: (
    query: string,
    limit?: number | undefined,
  ) => Effect.Effect<readonly SearchHit[], SearchError>;
  readonly remove: (id: string) => Effect.Effect<true, SearchError>;
};

/** Backward-compatible alias for the search service contract. */
export type SearchProvider = SearchService;
