import { planDocFallback, TECH_REFERENCES } from '@vybekiit/agent-kit';
import { type PageResult, paginate, scoreQuery } from './uiCatalog';

/** Slim tech-id row for discovery before calling doc_fallback. */
export type SlimTechRef = {
  readonly id: string;
  readonly label: string;
  readonly docsUrl: string;
  readonly score: number;
};

/**
 * Fuzzy-search known tech reference ids.
 *
 * @param query - Free-text tech name (empty = list all).
 * @param options - Optional limit and cursor.
 * @returns Page of slim tech rows.
 * @example
 * searchTechIds('stripe', { limit: 5 });
 */
export const searchTechIds = (
  query: string,
  options?: { readonly limit?: number; readonly cursor?: string },
): PageResult<SlimTechRef> => {
  const trimmed = query.trim();
  const ranked = TECH_REFERENCES.map((ref) => {
    const score = trimmed.length === 0 ? 1 : scoreQuery(trimmed, [ref.id, ref.label, ref.docsUrl]);
    return {
      id: ref.id,
      label: ref.label,
      docsUrl: ref.docsUrl,
      score,
    };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return paginate(ranked, options);
};

/**
 * Run the official-docs fallback plan for one tech id.
 *
 * @param techId - Known tech id from {@link searchTechIds}.
 * @returns Doc-fallback plan (same shape as `vybekiit doc-fallback`).
 * @example
 * runDocFallback('twilio');
 */
export const runDocFallback = (techId: string) => planDocFallback(techId);
