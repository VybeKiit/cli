import { Either, Schema } from 'effect';

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

type SearchComponentOptions = {
  readonly source?: string;
  readonly category?: string;
  readonly limit?: number;
};

const decodeCatalogIndex = Schema.decodeUnknownEither(UiCatalogIndexSchema);
const defaultSearchLimit = 20;
const defaultSuggestionLimit = 10;
// split on whitespace: "hero   bento" -> ["hero", "bento"]
const searchTermPattern = /\s+/;

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
 * Resolve the component search result limit.
 *
 * @param options - Optional search filters and limit.
 * @returns The explicit limit, or the package default.
 * @example
 * resolveSearchLimit({ limit: 5 }) === 5;
 */
const resolveSearchLimit = (options: SearchComponentOptions | undefined): number => {
  if (options?.limit !== undefined) {
    return options.limit;
  }
  return defaultSearchLimit;
};

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
 * Search catalog components by text, source, and category.
 *
 * @param catalog - Validated catalog index to search.
 * @param query - Keyword string matched against names, sources, categories, tags, and paths.
 * @param options - Optional source/category filters and result limit.
 * @returns Components ranked by text-match score.
 * @example
 * const heroComponents = searchComponents(catalog, 'animated hero', { category: 'hero' });
 */
export const searchComponents = (
  catalog: UiCatalogIndex,
  query: string,
  options?: SearchComponentOptions,
): CatalogComponent[] => {
  const terms = query.toLowerCase().split(searchTermPattern).filter(Boolean);
  const limit = resolveSearchLimit(options);

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
      const haystack = [
        component.name,
        component.source,
        component.category,
        ...component.tags,
        ...component.paths,
      ]
        .join(' ')
        .toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { component, score };
    })
    .filter(({ score }) => score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ component }) => component);
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

  const results = searchComponents(catalog, intent, { limit: limit * 3 });
  const ranked = results
    .map((component) => {
      let score = 1;
      if (preferredSources.includes(component.source)) {
        score += 3;
      }
      if (preferredCategories.includes(component.category)) {
        score += 2;
      }
      if (component.tags.some((tag) => lower.includes(tag))) {
        score += 1;
      }
      return { source: component.source, name: component.name, score, paths: component.paths };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
};
