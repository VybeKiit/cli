import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** One integration note from the page-recipe manifest. */
export type PageRecipeInstallNote = {
  readonly kind: string;
  readonly label: string;
  readonly note: string;
  readonly todo?: string;
  readonly owner?: string;
};

/** Provider-owned setup pointer attached to a recipe group. */
export type PageRecipeProviderPointer = {
  readonly provider: string;
  readonly note: string;
};

/** One installable page recipe (manifest slice, no generated sourceCode). */
export type PageRecipeSummary = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly sourcePath: string;
  readonly exportName: string;
  readonly targetRoute: string;
  readonly suggestedComponents: readonly string[];
  readonly installNotes: readonly PageRecipeInstallNote[];
  readonly acceptanceChecks: readonly string[];
  readonly groupId: string;
  readonly groupLabel: string;
  readonly groupDescription: string;
  readonly presetIds: readonly string[];
  readonly goalIds: readonly string[];
  readonly providerPointers: readonly PageRecipeProviderPointer[];
};

type ManifestInstallNote = {
  readonly kind?: string;
  readonly label?: string;
  readonly note?: string;
  readonly todo?: string;
  readonly owner?: string;
};

type ManifestRecipe = {
  readonly id?: string;
  readonly slug?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly sourcePath?: string;
  readonly exportName?: string;
  readonly targetRoute?: string;
  readonly suggestedComponents?: readonly string[];
  readonly installNotes?: readonly ManifestInstallNote[];
  readonly acceptanceChecks?: readonly string[];
};

type ManifestGroup = {
  readonly id?: string;
  readonly label?: string;
  readonly description?: string;
  readonly presetIds?: readonly string[];
  readonly goalIds?: readonly string[];
  readonly providerPointers?: readonly PageRecipeProviderPointer[];
  readonly recipes?: readonly ManifestRecipe[];
};

type PageRecipeManifest = {
  readonly groups?: readonly ManifestGroup[];
};

/** Relative path of the page-recipe manifest inside a kit workspace root. */
export const PAGE_RECIPE_MANIFEST_RELATIVE = join('scripts', 'data', 'page-recipe-manifest.json');

/**
 * Resolve the absolute path of the page-recipe manifest under a kit root.
 *
 * @param kitRoot - Kit workspace root that contains `scripts/data/`.
 * @returns Absolute manifest path.
 * @example
 * const path = pageRecipeManifestPath('/repo');
 */
export const pageRecipeManifestPath = (kitRoot: string): string =>
  join(kitRoot, PAGE_RECIPE_MANIFEST_RELATIVE);

/**
 * Pick a non-empty string, or fall back when the field is missing/blank.
 *
 * @param value - Optional string from the manifest.
 * @param fallback - Value used when `value` is undefined or empty.
 * @returns Chosen string.
 * @example
 * const title = nonEmptyOr(recipe.title, recipe.id);
 */
const nonEmptyOr = (value: string | undefined, fallback: string): string => {
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
};

/**
 * Use the array when present; otherwise an empty list (manifest fields are optional).
 *
 * @param value - Optional array from the manifest.
 * @returns The array, or `[]` when missing.
 * @example
 * const ids = listOrEmpty(group.presetIds);
 */
const listOrEmpty = <T>(value: readonly T[] | undefined): readonly T[] => {
  if (value === undefined) {
    return [];
  }
  return value;
};

/**
 * Normalize one install note; drop incomplete rows.
 *
 * @param note - Raw note from the manifest.
 * @returns Zero or one normalized note.
 * @example
 * const notes = rawNotes.flatMap(installNotesFromManifest);
 */
const installNotesFromManifest = (note: ManifestInstallNote): readonly PageRecipeInstallNote[] => {
  if (note.label === undefined || note.note === undefined) {
    return [];
  }
  return [
    {
      kind: nonEmptyOr(note.kind, 'service'),
      label: note.label,
      note: note.note,
      ...(note.todo === undefined ? {} : { todo: note.todo }),
      ...(note.owner === undefined ? {} : { owner: note.owner }),
    },
  ];
};

/**
 * Normalize one recipe under a group; drop incomplete rows.
 *
 * @param recipe - Raw recipe from the manifest.
 * @param group - Parent group fields already validated.
 * @returns Zero or one summary.
 * @example
 * const rows = group.recipes.flatMap((r) => recipesFromManifest(r, groupFields));
 */
const recipesFromManifest = (
  recipe: ManifestRecipe,
  group: {
    readonly groupId: string;
    readonly groupLabel: string;
    readonly groupDescription: string;
    readonly presetIds: readonly string[];
    readonly goalIds: readonly string[];
    readonly providerPointers: readonly PageRecipeProviderPointer[];
  },
): readonly PageRecipeSummary[] => {
  const { id, sourcePath, exportName } = recipe;
  if (
    id === undefined ||
    id === '' ||
    sourcePath === undefined ||
    sourcePath === '' ||
    exportName === undefined ||
    exportName === ''
  ) {
    return [];
  }

  return [
    {
      id,
      slug: nonEmptyOr(recipe.slug, id),
      title: nonEmptyOr(recipe.title, id),
      summary: recipe.summary === undefined ? '' : recipe.summary,
      sourcePath,
      exportName,
      targetRoute: nonEmptyOr(recipe.targetRoute, `/${id}`),
      suggestedComponents: listOrEmpty(recipe.suggestedComponents),
      installNotes: listOrEmpty(recipe.installNotes).flatMap(installNotesFromManifest),
      acceptanceChecks: listOrEmpty(recipe.acceptanceChecks),
      groupId: group.groupId,
      groupLabel: group.groupLabel,
      groupDescription: group.groupDescription,
      presetIds: group.presetIds,
      goalIds: group.goalIds,
      providerPointers: group.providerPointers,
    },
  ];
};

/**
 * Flatten every recipe in one manifest group.
 *
 * @param group - Raw group from the manifest.
 * @returns Recipe summaries for that group (empty when the group has no id).
 * @example
 * const rows = recipesFromGroup(group);
 */
const recipesFromGroup = (group: ManifestGroup): readonly PageRecipeSummary[] => {
  if (group.id === undefined || group.id === '') {
    return [];
  }
  const groupId = group.id;
  const groupFields = {
    groupId,
    groupLabel: nonEmptyOr(group.label, groupId),
    groupDescription: group.description === undefined ? '' : group.description,
    presetIds: listOrEmpty(group.presetIds),
    goalIds: listOrEmpty(group.goalIds),
    providerPointers: listOrEmpty(group.providerPointers),
  };
  return listOrEmpty(group.recipes).flatMap((recipe) => recipesFromManifest(recipe, groupFields));
};

/**
 * Parse manifest JSON text into recipe summaries.
 *
 * @param raw - File contents of the page-recipe manifest.
 * @returns Flattened recipes, or empty when JSON is invalid.
 * @example
 * const recipes = parsePageRecipeManifest(raw);
 */
const parsePageRecipeManifest = (raw: string): readonly PageRecipeSummary[] => {
  let parsed: PageRecipeManifest;
  try {
    parsed = JSON.parse(raw) as PageRecipeManifest;
  } catch {
    return [];
  }
  return listOrEmpty(parsed.groups).flatMap(recipesFromGroup);
};

/**
 * Load and flatten every page recipe from the kit manifest.
 *
 * @param kitRoot - Kit workspace root that contains `scripts/data/`.
 * @returns Ordered recipe summaries, or empty when the manifest is missing/invalid.
 * @example
 * const recipes = await loadPageRecipes('/repo');
 */
export const loadPageRecipes = async (kitRoot: string): Promise<readonly PageRecipeSummary[]> => {
  try {
    const raw = await readFile(pageRecipeManifestPath(kitRoot), 'utf8');
    return parsePageRecipeManifest(raw);
  } catch {
    return [];
  }
};

/**
 * Find one page recipe by id or slug.
 *
 * @param recipes - Catalog loaded from {@link loadPageRecipes}.
 * @param idOrSlug - Recipe id or slug from CLI input.
 * @returns Matching recipe, or undefined when unknown.
 * @example
 * const recipe = findPageRecipe(recipes, 'cart');
 */
export const findPageRecipe = (
  recipes: readonly PageRecipeSummary[],
  idOrSlug: string,
): PageRecipeSummary | undefined =>
  recipes.find((recipe) => recipe.id === idOrSlug || recipe.slug === idOrSlug);
