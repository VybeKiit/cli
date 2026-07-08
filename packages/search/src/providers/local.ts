import type { SearchDocument, SearchHit, SearchProvider } from '@vybekiit/search/types';
import { Effect } from 'effect';

const defaultSearchLimit = 10;
const snippetLength = 120;
const docs = new Map<string, SearchDocument>();

/**
 * Build the in-memory search adapter for tests and local development.
 *
 * @returns A search provider backed by a process-local document map.
 * @example
 * const search = createLocalSearch();
 */
export const createLocalSearch = (): SearchProvider => ({
  name: 'local',
  index: (doc: SearchDocument) => {
    docs.set(doc.id, doc);
    return Effect.succeed(true as const);
  },
  search: (query: string, limit = defaultSearchLimit) => {
    const hits: SearchHit[] = [];
    for (const doc of docs.values()) {
      if (doc.content.toLowerCase().includes(query.toLowerCase())) {
        hits.push({ id: doc.id, score: 1, snippet: doc.content.slice(0, snippetLength) });
      }
      if (hits.length >= limit) {
        break;
      }
    }
    return Effect.succeed(hits as readonly SearchHit[]);
  },
  remove: (id: string) => {
    docs.delete(id);
    return Effect.succeed(true as const);
  },
});
