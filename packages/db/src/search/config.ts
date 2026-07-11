import { Schema } from 'effect';

/** Runtime config for the search provider resolver. */
export const SearchConfigSchema = Schema.Struct({
  SEARCH_PROVIDER: Schema.optionalWith(
    Schema.Literal('supabase', 'typesense', 'algolia', 'local'),
    {
      default: () => 'supabase' as const,
    },
  ),
});

/** Static type inferred from {@link SearchConfigSchema}. */
export type SearchConfigType = Schema.Schema.Type<typeof SearchConfigSchema>;

/** Backward-compatible alias for the search config shape. */
export type SearchConfig = SearchConfigType;
