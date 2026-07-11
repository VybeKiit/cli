import { Either, Schema } from 'effect';
import { scoreQuery } from './fuzzy.js';
import { type PageResult, paginate } from './page.js';

const CatalogComponentSchema = Schema.Struct({
  source: Schema.String,
  name: Schema.String,
  paths: Schema.Array(Schema.String),
  dependencies: Schema.Array(Schema.String),
  tags: Schema.Array(Schema.String),
  portable: Schema.Boolean,
  category: Schema.String,
});

/** Schema for the generated mirrored UI catalog index. */
export const UiCatalogIndexSchema = Schema.Struct({
  version: Schema.Number,
  generatedAt: Schema.String,
  componentCount: Schema.Number,
  sources: Schema.Record({ key: Schema.String, value: Schema.Number }),
  components: Schema.Array(CatalogComponentSchema),
});

/** Mirrored UI component entry decoded from the generated catalog index. */
export type CatalogComponent = typeof CatalogComponentSchema.Type;

/** Generated UI catalog index decoded from `ui-catalog-index.json`. */
export type UiCatalogIndex = typeof UiCatalogIndexSchema.Type;

/** How much of each component row to return (context control). */
export type ComponentFields = 'slim' | 'full';

/** Slim row for search lists — enough to pick a component without dumping paths. */
export type SlimCatalogComponent = {
  readonly source: string;
  readonly name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly portable: boolean;
  readonly score: number;
};

/** Full row with path + dependency detail and match score. */
export type FullCatalogComponent = CatalogComponent & {
  readonly score: number;
};

type SearchComponentOptions = {
  readonly source?: string;
  readonly category?: string;
  readonly limit?: number;
  readonly cursor?: string;
  readonly fields?: ComponentFields;
};

const decodeCatalogIndex = Schema.decodeUnknownEither(UiCatalogIndexSchema);
const defaultSuggestionLimit = 10;

const INTENT_ROUTING: ReadonlyArray<{
  readonly keywords: readonly string[];
  readonly sources: readonly string[];
  readonly category?: string;
}> = [
  {
    keywords: ['hero', 'landing', 'wow', 'parallax'],
    sources: ['aceternity', 'magicui'],
    category: 'hero',
  },
  { keywords: ['bento', 'feature', 'grid'], sources: ['magicui', 'kokonutui', 'bundui'] },
  { keywords: ['pricing', 'testimonial', 'faq'], sources: ['bundui', 'blocks/21st'] },
  {
    keywords: ['dashboard', 'kpi', 'chart', 'table'],
    sources: ['bundui', 'untitled'],
    category: 'data-display',
  },
  { keywords: ['form', 'input', 'settings'], sources: ['ui', 'bundui'], category: 'form' },
  { keywords: ['chat', 'ai'], sources: ['kokonutui', 'bundui'] },
  { keywords: ['admin', 'enterprise', 'dense'], sources: ['untitled', 'bundui'] },
  {
    keywords: ['background', 'beam', 'sparkle', 'animated'],
    sources: ['aceternity', 'magicui'],
    category: 'background',
  },
];

/**
 * Decode a generated UI catalog JSON string.
 *
 * @param json - Serialized catalog index content.
 * @returns The validated catalog index.
 * @example
 * const catalog = loadCatalog(await readFile(catalogPath, 'utf8'));
 */
export const loadCatalog = (json: string): UiCatalogIndex => {
  const parsed = decodeCatalogIndex(JSON.parse(json));
  if (Either.isLeft(parsed)) {
    throw new Error('Invalid UI catalog index JSON.');
  }
  return parsed.right;
};

/**
 * Project a scored component to the slim list shape.
 *
 * @param component - Full catalog component.
 * @param score - Fuzzy match score.
 * @returns Slim row for agent list tools.
 * @example
 * toSlim(component, 120);
 */
const toSlim = (component: CatalogComponent, score: number): SlimCatalogComponent => ({
  source: component.source,
  name: component.name,
  category: component.category,
  tags: component.tags,
  portable: component.portable,
  score,
});

/**
 * Project a scored component to the full list shape.
 *
 * @param component - Full catalog component.
 * @param score - Fuzzy match score.
 * @returns Full row including paths and dependencies.
 * @example
 * toFull(component, 120);
 */
const toFull = (component: CatalogComponent, score: number): FullCatalogComponent => ({
  ...component,
  score,
});

/**
 * Rank all matching components by fuzzy score (no pagination).
 *
 * @param catalog - Validated catalog index.
 * @param query - Free-text query.
 * @param options - Optional source/category filters.
 * @returns Ranked scored components (highest first).
 * @example
 * rankComponents(catalog, 'hero', { category: 'hero' });
 */
const rankComponents = (
  catalog: UiCatalogIndex,
  query: string,
  options?: Pick<SearchComponentOptions, 'source' | 'category'> & {
    readonly matchMode?: 'all' | 'any';
  },
): ReadonlyArray<{ readonly component: CatalogComponent; readonly score: number }> => {
  const trimmed = query.trim();
  const matchMode = options?.matchMode ?? 'all';
  const scored = catalog.components
    .filter((component) => {
      if (options?.source !== undefined && component.source !== options.source) {
        return false;
      }
      if (options?.category !== undefined && component.category !== options.category) {
        return false;
      }
      return true;
    })
    .map((component) => {
      const score =
        trimmed.length === 0
          ? 1
          : scoreQuery(
              trimmed,
              [
                component.name,
                component.source,
                component.category,
                ...component.tags,
                ...component.paths,
              ],
              matchMode,
            );
      return { component, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.component.name.localeCompare(b.component.name));

  return scored;
};

/**
 * Search catalog components with fuzzy ranking, cursor pagination, and field projection.
 *
 * @param catalog - Validated catalog index to search.
 * @param query - Keyword string matched with fuzzy scoring against names, sources, categories, tags, and paths.
 * @param options - Optional source/category filters, limit, cursor, and fields mode (`slim` default).
 * @returns Page envelope of slim or full component rows.
 * @example
 * const page = searchComponents(catalog, 'animated hero', { limit: 5, fields: 'slim' });
 * if (page.hasMore) searchComponents(catalog, 'animated hero', { cursor: page.nextCursor ?? undefined });
 */
export const searchComponents = (
  catalog: UiCatalogIndex,
  query: string,
  options?: SearchComponentOptions,
): PageResult<SlimCatalogComponent | FullCatalogComponent> => {
  const ranked = rankComponents(catalog, query, options);
  const fields = options?.fields ?? 'slim';
  const projected =
    fields === 'full'
      ? ranked.map(({ component, score }) => toFull(component, score))
      : ranked.map(({ component, score }) => toSlim(component, score));

  return paginate(projected, {
    ...(options?.limit === undefined ? {} : { limit: options.limit }),
    ...(options?.cursor === undefined ? {} : { cursor: options.cursor }),
  });
};

/**
 * Find one component by source namespace and slug.
 *
 * @param catalog - Validated catalog index to search.
 * @param source - Component source namespace.
 * @param name - Component slug within the source namespace.
 * @returns The matching component, or undefined when no exact match exists.
 * @example
 * const marquee = getComponent(catalog, 'magicui', 'marquee');
 */
export const getComponent = (
  catalog: UiCatalogIndex,
  source: string,
  name: string,
): CatalogComponent | undefined =>
  catalog.components.find((component) => component.source === source && component.name === name);

/**
 * Return component counts by source namespace.
 *
 * @param catalog - Validated catalog index to summarize.
 * @returns A source-name to component-count record.
 * @example
 * const sources = listSources(catalog);
 */
export const listSources = (catalog: UiCatalogIndex): Record<string, number> => catalog.sources;

/**
 * Rank components for a natural-language UI intent.
 *
 * @param catalog - Validated catalog index to search.
 * @param intent - Natural-language UI request from the builder or agent.
 * @param limit - Maximum number of suggestions to return.
 * @returns Ranked component suggestions with source, name, score, and file paths.
 * @example
 * const suggestions = suggestBlend(catalog, 'animated pricing hero', 5);
 */
export const suggestBlend = (
  catalog: UiCatalogIndex,
  intent: string,
  limit = defaultSuggestionLimit,
): Array<{ source: string; name: string; score: number; paths: readonly string[] }> => {
  const lower = intent.toLowerCase();
  const matchedRoutes = INTENT_ROUTING.filter((route) =>
    route.keywords.some((keyword) => lower.includes(keyword)),
  );
  const preferredSources = matchedRoutes.flatMap((route) => route.sources);
  const preferredCategories = matchedRoutes
    .map((route) => route.category)
    .filter((category): category is string => Boolean(category));

  // Intent phrases are loose ("animated hero landing") — match any term, then re-rank.
  const rankedAll = rankComponents(catalog, intent, { matchMode: 'any' });
  const ranked = rankedAll
    .map(({ component, score: baseScore }) => {
      let score = baseScore;
      if (preferredSources.includes(component.source)) {
        score += 30;
      }
      if (preferredCategories.includes(component.category)) {
        score += 20;
      }
      if (component.tags.some((tag) => lower.includes(tag))) {
        score += 10;
      }
      return {
        source: component.source,
        name: component.name,
        score,
        paths: component.paths,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
};
