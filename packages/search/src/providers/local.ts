import type { SearchDocument, SearchHit, SearchProvider } from '@vybekiit/search/types';
import { Effect } from 'effect';

const docs = new Map<string, SearchDocument>();

export function createLocalSearch(): SearchProvider {
  return {
    name: 'local',
    index(doc: SearchDocument) {
      docs.set(doc.id, doc);
      return Effect.succeed(true as const);
    },
    search(query: string, limit = 10) {
      const hits: SearchHit[] = [];
      for (const doc of docs.values()) {
        if (doc.content.toLowerCase().includes(query.toLowerCase())) {
          hits.push({ id: doc.id, score: 1, snippet: doc.content.slice(0, 120) });
        }
        if (hits.length >= limit) break;
      }
      return Effect.succeed(hits as readonly SearchHit[]);
    },
    remove(id: string) {
      docs.delete(id);
      return Effect.succeed(true as const);
    },
  };
}
