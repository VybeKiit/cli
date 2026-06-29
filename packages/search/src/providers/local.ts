import { type Result, ok } from '@vybekiit/core';
import type { SearchDocument, SearchHit, SearchProvider } from '../types';

const docs = new Map<string, SearchDocument>();

export function createLocalSearch(): SearchProvider {
  return {
    name: 'local',
    async index(doc: SearchDocument): Promise<Result<true>> {
      docs.set(doc.id, doc);
      return ok(true);
    },
    async search(query: string, limit = 10): Promise<Result<readonly SearchHit[]>> {
      const hits: SearchHit[] = [];
      for (const doc of docs.values()) {
        if (doc.content.toLowerCase().includes(query.toLowerCase())) {
          hits.push({ id: doc.id, score: 1, snippet: doc.content.slice(0, 120) });
        }
        if (hits.length >= limit) break;
      }
      return ok(hits);
    },
    async remove(id: string): Promise<Result<true>> {
      docs.delete(id);
      return ok(true);
    },
  };
}
