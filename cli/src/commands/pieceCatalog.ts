import { ALL_PRESETS } from '@vybekiit/db';
import type { PageRecipeSummary } from '../lib/pageRecipeCatalog';

/** Unified catalog piece kind for agents. */
export type PieceKind = 'db' | 'page-recipe' | 'backend';

/** One listable ready piece across DB presets, page recipes, and backend scaffolds. */
export type CatalogPiece = {
  readonly kind: PieceKind;
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly group?: string;
  readonly linkedPresets?: readonly string[];
  readonly command: string;
};

/**
 * Build the static backend piece entries (always available as CLI verbs).
 *
 * @returns Backend catalog rows.
 * @example
 * const backend = backendPieces();
 */
export const backendPieces = (): readonly CatalogPiece[] => [
  {
    kind: 'backend',
    id: 'scaffold-backend',
    title: 'Scaffold backend',
    summary: 'Add an Express API package into the kit workspace.',
    command: 'vybekiit scaffold backend [directory]',
  },
  {
    kind: 'backend',
    id: 'add-route',
    title: 'Add API route',
    summary: 'Generate a named route inside an existing backend.',
    command: 'vybekiit backend add-route <name>',
  },
  {
    kind: 'backend',
    id: 'add-crud',
    title: 'Add CRUD resource',
    summary: 'Generate CRUD handlers for a resource name.',
    command: 'vybekiit backend add-crud <resource>',
  },
  {
    kind: 'backend',
    id: 'add-upload',
    title: 'Add file upload',
    summary: 'Generate an upload endpoint on the backend.',
    command: 'vybekiit backend add-upload',
  },
];

/**
 * Map DB presets into unified catalog pieces.
 *
 * @returns DB preset catalog rows.
 * @example
 * const db = dbPieces();
 */
export const dbPieces = (): readonly CatalogPiece[] =>
  ALL_PRESETS.map((preset) => {
    const summary =
      preset.description === undefined || preset.description === ''
        ? `Database preset ${preset.id}`
        : preset.description;
    return {
      kind: 'db' as const,
      id: preset.id,
      title: preset.id,
      summary,
      command: `vybekiit apply-preset ${preset.id}`,
    };
  });

/**
 * Map page recipes into unified catalog pieces.
 *
 * @param recipes - Loaded page recipe summaries.
 * @returns Page-recipe catalog rows.
 * @example
 * const pages = pageRecipePieces(recipes);
 */
export const pageRecipePieces = (recipes: readonly PageRecipeSummary[]): readonly CatalogPiece[] =>
  recipes.map((recipe) => ({
    kind: 'page-recipe' as const,
    id: recipe.id,
    title: recipe.title,
    summary: recipe.summary,
    group: recipe.groupLabel,
    linkedPresets: recipe.presetIds,
    command: `vybekiit add page-recipe ${recipe.id}`,
  }));

/**
 * Build the full catalog, optionally filtered by kind.
 *
 * @param recipes - Loaded page recipes (may be empty offline).
 * @param kindFilter - Optional kind from `--kind`.
 * @returns Catalog rows.
 * @example
 * const pieces = buildCatalog(recipes, 'page-recipe');
 */
export const buildCatalog = (
  recipes: readonly PageRecipeSummary[],
  kindFilter: string | undefined,
): readonly CatalogPiece[] =>
  [...dbPieces(), ...pageRecipePieces(recipes), ...backendPieces()].filter(
    (piece) => kindFilter === undefined || piece.kind === kindFilter,
  );
