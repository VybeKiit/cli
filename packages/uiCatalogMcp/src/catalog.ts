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

export const UiCatalogIndexSchema = Schema.Struct({
  version: Schema.Number,
  generatedAt: Schema.String,
  componentCount: Schema.Number,
  sources: Schema.Record({ key: Schema.String, value: Schema.Number }),
  components: Schema.Array(CatalogComponentSchema),
});

export type CatalogComponent = typeof CatalogComponentSchema.Type;
export type UiCatalogIndex = typeof UiCatalogIndexSchema.Type;

const decodeCatalogIndex = Schema.decodeUnknownEither(UiCatalogIndexSchema);

const INTENT_ROUTING: ReadonlyArray<{
  keywords: string[];
  sources: string[];
  category?: string;
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

export function loadCatalog(json: string): UiCatalogIndex {
  const parsed = decodeCatalogIndex(JSON.parse(json));
  if (Either.isLeft(parsed)) {
    throw new Error('Invalid UI catalog index JSON.');
  }
  return parsed.right;
}

export function searchComponents(
  catalog: UiCatalogIndex,
  query: string,
  options?: { source?: string; category?: string; limit?: number },
): CatalogComponent[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const limit = options?.limit ?? 20;

  const scored = catalog.components
    .filter((component) => {
      if (options?.source && component.source !== options.source) return false;
      if (options?.category && component.category !== options.category) return false;
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
}

export function getComponent(
  catalog: UiCatalogIndex,
  source: string,
  name: string,
): CatalogComponent | undefined {
  return catalog.components.find(
    (component) => component.source === source && component.name === name,
  );
}

export function listSources(catalog: UiCatalogIndex): Record<string, number> {
  return catalog.sources;
}

export function suggestBlend(
  catalog: UiCatalogIndex,
  intent: string,
  limit = 10,
): Array<{ source: string; name: string; score: number; paths: readonly string[] }> {
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
      if (preferredSources.includes(component.source)) score += 3;
      if (preferredCategories.includes(component.category)) score += 2;
      if (component.tags.some((tag) => lower.includes(tag))) score += 1;
      return { source: component.source, name: component.name, score, paths: component.paths };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}
