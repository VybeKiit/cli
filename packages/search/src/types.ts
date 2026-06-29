import type { Result } from '@vybekiit/core';

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

export interface SearchProvider {
  readonly name: SearchProviderName;
  index(doc: SearchDocument): Promise<Result<true>>;
  search(query: string, limit?: number | undefined): Promise<Result<readonly SearchHit[]>>;
  remove(id: string): Promise<Result<true>>;
}
