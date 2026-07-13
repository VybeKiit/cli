#!/usr/bin/env node
/**
 * Validate the Page recipe manifest and emit the component-library data module.
 */

import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const MANIFEST_PATH = 'scripts/data/page-recipe-manifest.json';
const OUT_PATH = 'apps/componentLibrary/src/data/pageRecipes.ts';
const OUT_COMPONENTS_PATH = 'apps/componentLibrary/src/data/pageRecipeComponents.tsx';
const OUT_GROUPS_PATH = 'apps/componentLibrary/src/data/pageRecipeGroups.ts';
const DB_PRESETS_ROOT = 'packages/db/presets';
const GOAL_CATALOG_PATH = 'packages/agentKit/src/catalogs/goalCatalog.ts';
const COMPONENT_STATES_PATH = 'apps/componentLibrary/src/lib/componentStates.json';

/**
 * @typedef {'visual' | 'service' | 'provider'} InstallNoteKind
 *
 * @typedef {object} PageRecipeInstallNote
 * @property {InstallNoteKind} kind
 * @property {string} label
 * @property {string} note
 * @property {string=} todo
 * @property {string=} owner
 *
 * @typedef {object} PageRecipeProviderPointer
 * @property {string} provider
 * @property {string} note
 *
 * @typedef {object} PageRecipeManifestRecipe
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {string} summary
 * @property {string} sourcePath
 * @property {string} exportName
 * @property {string} targetRoute
 * @property {string[]} suggestedComponents
 * @property {PageRecipeInstallNote[]} installNotes
 * @property {string[]} acceptanceChecks
 *
 * @typedef {object} PageRecipeManifestGroup
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {number} order
 * @property {string[]=} presetIds
 * @property {string[]=} goalIds
 * @property {PageRecipeProviderPointer[]=} providerPointers
 * @property {PageRecipeManifestRecipe[]} recipes
 *
 * @typedef {object} PageRecipeManifest
 * @property {number} version
 * @property {PageRecipeManifestGroup[]} groups
 *
 * @typedef {PageRecipeManifestRecipe & { sourceCode: string, todos: string[] }} PageRecipeIndexRecipe
 * @typedef {Omit<PageRecipeManifestGroup, 'recipes'> & { recipes: PageRecipeIndexRecipe[] }} PageRecipeIndexGroup
 *
 * @typedef {object} PageRecipeIndex
 * @property {number} version
 * @property {PageRecipeIndexGroup[]} groups
 */

const uniqueSorted = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const assertString = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
};

const assertStringArray = (value, label) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${label} must be an array of strings`);
  }
  return value;
};

const parseJsonFile = async (path) => JSON.parse(await readFile(path, 'utf8'));

/**
 * Read all DB preset IDs from checked-in preset manifests.
 *
 * @param {string} repoRoot - Absolute repository root.
 * @returns {Promise<string[]>} Sorted DB preset IDs.
 * @example
 * const ids = await readDbPresetIds(process.cwd());
 */
export const readDbPresetIds = async (repoRoot = REPO_ROOT) => {
  const presetsRoot = join(repoRoot, DB_PRESETS_ROOT);
  const entries = await readdir(presetsRoot, { withFileTypes: true });
  const ids = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) {
      continue;
    }
    const manifestPath = join(presetsRoot, entry.name, 'preset.manifest.json');
    try {
      const manifest = await parseJsonFile(manifestPath);
      ids.push(assertString(manifest.id, `${manifestPath} id`));
    } catch (error) {
      if (error instanceof Error && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  return uniqueSorted(ids);
};

/**
 * Read web-facing goal IDs from the agent-kit goal catalog.
 *
 * @param {string} repoRoot - Absolute repository root.
 * @returns {Promise<string[]>} Sorted web-facing goal IDs.
 * @example
 * const ids = await readWebGoalIds(process.cwd());
 */
export const readWebGoalIds = async (repoRoot = REPO_ROOT) => {
  const source = await readFile(join(repoRoot, GOAL_CATALOG_PATH), 'utf8');
  const ids = [];

  for (const match of source.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?skills:\s*\{([\s\S]*?)\}\s*,?\s*\}/g)) {
    const id = match[1];
    const skills = match[2] ?? '';
    if (id !== undefined && /web:\s*'[^']+'/.test(skills)) {
      ids.push(id);
    }
  }

  return uniqueSorted(ids);
};

/**
 * Read the canonical states a Page recipe may advertise (the recipe-level subset, ADR-0041).
 *
 * @param {string} repoRoot - Absolute repository root.
 * @returns {Promise<string[]>} Recipe-level canonical state ids.
 * @example
 * const ids = await readRecipeStateIds(process.cwd());
 */
export const readRecipeStateIds = async (repoRoot = REPO_ROOT) => {
  try {
    const states = await parseJsonFile(join(repoRoot, COMPONENT_STATES_PATH));
    return states.filter((state) => state.recipeLevel === true).map((state) => state.id);
  } catch (error) {
    if (error instanceof Error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const readTodoNotes = (sourceCode) =>
  sourceCode
    .split('\n')
    .map((line) => {
      const markerIndex = line.indexOf('TODO:');
      return markerIndex === -1 ? null : line.slice(markerIndex + 'TODO:'.length).trim();
    })
    .filter((note) => typeof note === 'string' && note.length > 0);

const ensureKnownIds = (actual, expected, label) => {
  const unknown = actual.filter((id) => !expected.includes(id));
  if (unknown.length > 0) {
    throw new Error(`Unknown ${label}: ${unknown.join(', ')}`);
  }
};

const assertRecipeShape = (group, recipe) => {
  assertString(recipe.id, `Recipe in ${group.id} id`);
  assertString(recipe.slug, `Recipe ${recipe.id} slug`);
  assertString(recipe.title, `Recipe ${recipe.id} title`);
  assertString(recipe.summary, `Recipe ${recipe.id} summary`);
  assertString(recipe.sourcePath, `Recipe ${recipe.id} sourcePath`);
  assertString(recipe.exportName, `Recipe ${recipe.id} exportName`);
  assertString(recipe.targetRoute, `Recipe ${recipe.id} targetRoute`);
  assertStringArray(recipe.suggestedComponents, `Recipe ${recipe.id} suggestedComponents`);
  if (!Array.isArray(recipe.installNotes) || recipe.installNotes.length === 0) {
    throw new Error(`Recipe ${recipe.id} must include install notes`);
  }
  for (const note of recipe.installNotes) {
    assertString(note.kind, `Recipe ${recipe.id} install note kind`);
    assertString(note.label, `Recipe ${recipe.id} install note label`);
    assertString(note.note, `Recipe ${recipe.id} install note text`);
    if (!['visual', 'service', 'provider'].includes(note.kind)) {
      throw new Error(`Recipe ${recipe.id} install note ${note.label} has unsupported kind`);
    }
  }
  assertStringArray(recipe.acceptanceChecks, `Recipe ${recipe.id} acceptanceChecks`);
};

const groupNeedsPaymentPointer = (group) => {
  const ids = [...(group.goalIds ?? []), ...(group.presetIds ?? []), group.id];
  return ids.some((id) =>
    ['setup-payments', 'wire-payments', 'orders', 'webhook_events', 'payments'].includes(id),
  );
};

const validateSourceFile = async ({ repoRoot, recipe, recipeStateIds = [] }) => {
  const sourcePath = join(repoRoot, recipe.sourcePath);
  await access(sourcePath);
  const sourceCode = await readFile(sourcePath, 'utf8');
  if (!sourceCode.includes(`export const ${recipe.exportName}`)) {
    throw new Error(`Recipe ${recipe.id} source must export const ${recipe.exportName}`);
  }

  const todos = readTodoNotes(sourceCode);
  const noteTodos = new Set(recipe.installNotes.map((note) => note.todo).filter(Boolean));
  for (const todo of todos) {
    if (!noteTodos.has(todo)) {
      throw new Error(`Recipe ${recipe.id} is missing install notes for TODO: ${todo}`);
    }
  }

  const statesCovered = recipe.statesCovered ?? [];
  assertStringArray(statesCovered, `Recipe ${recipe.id} statesCovered`);
  ensureKnownIds(statesCovered, recipeStateIds, `Recipe ${recipe.id} statesCovered state`);

  return { ...recipe, sourceCode, todos, statesCovered };
};

/**
 * Validate the manifest against current feature and source coverage.
 *
 * @param {{ repoRoot?: string, manifest: PageRecipeManifest }} options - Validation options.
 * @returns {Promise<PageRecipeIndex>} Validated index with recipe source text.
 * @example
 * const index = await validatePageRecipeManifest({ manifest });
 */
export const validatePageRecipeManifest = async ({ repoRoot = REPO_ROOT, manifest }) => {
  if (manifest.version !== 1) {
    throw new Error('Page recipe manifest version must be 1');
  }
  if (!Array.isArray(manifest.groups) || manifest.groups.length === 0) {
    throw new Error('Page recipe manifest must include groups');
  }

  const expectedPresetIds = await readDbPresetIds(repoRoot);
  const expectedGoalIds = await readWebGoalIds(repoRoot);
  const recipeStateIds = await readRecipeStateIds(repoRoot);
  const coveredPresetIds = [];
  const coveredGoalIds = [];
  const groupIds = new Set();
  const recipeIds = new Set();
  const slugs = new Set();
  const groups = [];

  for (const group of manifest.groups) {
    assertString(group.id, 'Feature recipe group id');
    assertString(group.label, `Feature recipe group ${group.id} label`);
    assertString(group.description, `Feature recipe group ${group.id} description`);
    if (!Number.isFinite(group.order)) {
      throw new Error(`Feature recipe group ${group.id} order must be a number`);
    }
    if (groupIds.has(group.id)) {
      throw new Error(`Duplicate Feature recipe group id: ${group.id}`);
    }
    groupIds.add(group.id);

    const presetIds = group.presetIds ?? [];
    const goalIds = group.goalIds ?? [];
    assertStringArray(presetIds, `Feature recipe group ${group.id} presetIds`);
    assertStringArray(goalIds, `Feature recipe group ${group.id} goalIds`);
    ensureKnownIds(presetIds, expectedPresetIds, 'DB preset IDs');
    ensureKnownIds(goalIds, expectedGoalIds, 'web goal IDs');
    coveredPresetIds.push(...presetIds);
    coveredGoalIds.push(...goalIds);

    if (!Array.isArray(group.recipes) || group.recipes.length === 0) {
      throw new Error(`Feature recipe group ${group.id} must include recipes`);
    }
    if (groupNeedsPaymentPointer(group)) {
      const pointers = group.providerPointers ?? [];
      const hasPaymentsPointer = pointers.some((pointer) => pointer.provider === 'payments');
      if (!hasPaymentsPointer) {
        throw new Error(`Payment recipe group ${group.id} must include a payments provider pointer`);
      }
    }

    const recipes = [];
    for (const recipe of group.recipes) {
      assertRecipeShape(group, recipe);
      if (recipeIds.has(recipe.id)) {
        throw new Error(`Duplicate Page recipe id: ${recipe.id}`);
      }
      if (slugs.has(recipe.slug)) {
        throw new Error(`Duplicate Page recipe slug: ${recipe.slug}`);
      }
      recipeIds.add(recipe.id);
      slugs.add(recipe.slug);
      recipes.push(await validateSourceFile({ repoRoot, recipe, recipeStateIds }));
    }

    groups.push({
      ...group,
      presetIds,
      goalIds,
      providerPointers: group.providerPointers ?? [],
      recipes,
    });
  }

  const missingPresetIds = expectedPresetIds.filter((id) => !coveredPresetIds.includes(id));
  if (missingPresetIds.length > 0) {
    throw new Error(`Missing page recipe coverage for DB presets: ${missingPresetIds.join(', ')}`);
  }
  const missingGoalIds = expectedGoalIds.filter((id) => !coveredGoalIds.includes(id));
  if (missingGoalIds.length > 0) {
    throw new Error(`Missing page recipe coverage for web goals: ${missingGoalIds.join(', ')}`);
  }

  groups.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  return { version: manifest.version, groups };
};

/**
 * Render the TypeScript data module consumed by the component library.
 *
 * @param {PageRecipeIndex} index - Validated Page recipe index.
 * @returns {string} TypeScript module source.
 * @example
 * const source = buildGeneratedPageRecipeSource(index);
 */
export const buildGeneratedPageRecipeSource = (index) => {
  const recipes = index.groups.flatMap((group) =>
    group.recipes.map((recipe) => ({
      ...recipe,
      groupId: group.id,
      groupLabel: group.label,
      groupDescription: group.description,
      providerPointers: group.providerPointers ?? [],
    })),
  );

  return `/** Generated by scripts/dev/sync/buildPageRecipeIndex.mjs - do not edit. */
// biome-ignore-all format: generated recipe data stays byte-stable for check mode.
export type PageRecipeInstallNoteKind = 'visual' | 'service' | 'provider';

export interface PageRecipeInstallNote {
  readonly kind: PageRecipeInstallNoteKind;
  readonly label: string;
  readonly note: string;
  readonly todo?: string;
  readonly owner?: string;
}

export interface PageRecipeProviderPointer {
  readonly provider: string;
  readonly note: string;
}

export interface PageRecipe {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly sourcePath: string;
  readonly sourceCode: string;
  readonly exportName: string;
  readonly targetRoute: string;
  readonly suggestedComponents: readonly string[];
  readonly installNotes: readonly PageRecipeInstallNote[];
  readonly acceptanceChecks: readonly string[];
  readonly todos: readonly string[];
  readonly statesCovered: readonly string[];
  readonly groupId: string;
  readonly groupLabel: string;
  readonly groupDescription: string;
  readonly providerPointers: readonly PageRecipeProviderPointer[];
}

export interface PageRecipeGroup {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly order: number;
  readonly presetIds: readonly string[];
  readonly goalIds: readonly string[];
  readonly providerPointers: readonly PageRecipeProviderPointer[];
  readonly recipes: readonly PageRecipe[];
}

export const PAGE_RECIPES = ${JSON.stringify(recipes, null, 2)} as const satisfies readonly PageRecipe[];

export const PAGE_RECIPE_GROUPS = ${JSON.stringify(index.groups.map(({ recipes: _recipes, ...group }) => group), null, 2)} as const satisfies readonly Omit<PageRecipeGroup, 'recipes'>[];

export const FEATURE_RECIPE_GROUPS = PAGE_RECIPE_GROUPS;

export const PAGE_RECIPE_BY_SLUG = Object.fromEntries(
  PAGE_RECIPES.map((recipe) => [recipe.slug, recipe]),
) as Record<string, PageRecipe>;
`;
};

/**
 * Render a tiny standalone group-summary module (id, label, recipe count) so shell + nav code can
 * list Page recipe groups without statically importing the ~815 KB `pageRecipes.ts` blob (which, in
 * dev, would otherwise compile into every route's graph via the app shell).
 *
 * @param {PageRecipeIndex} index - Validated Page recipe index.
 * @returns {string} TypeScript module source.
 * @example
 * const source = buildGeneratedPageRecipeGroupsSource(index);
 */
export const buildGeneratedPageRecipeGroupsSource = (index) => {
  const summaries = index.groups.map((group) => ({
    id: group.id,
    label: group.label,
    count: group.recipes.length,
  }));

  return `/** Generated by scripts/dev/sync/buildPageRecipeIndex.mjs - do not edit. */
// biome-ignore-all format: generated group summaries stay byte-stable for check mode.

export interface PageRecipeGroupSummary {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

export const PAGE_RECIPE_GROUP_SUMMARIES = ${JSON.stringify(summaries, null, 2)} as const satisfies readonly PageRecipeGroupSummary[];
`;
};

/**
 * Resolve a `@library/*` import path for a Page recipe source under the component library.
 *
 * ADR-0026 bans parent-relative (`../`) imports; the data module imports via the
 * `@library` alias instead of climbing out of `src/data/`.
 *
 * @param {string} sourcePath - Repo-relative path such as
 *   `apps/componentLibrary/src/pageRecipes/AuthPage/AuthPage.tsx`.
 * @returns {string} Import specifier, e.g. `@library/pageRecipes/AuthPage/AuthPage`.
 * @example
 * importPathFromDataModule('apps/componentLibrary/src/pageRecipes/AuthPage.tsx');
 */
const importPathFromDataModule = (sourcePath) => {
  const sourceRoot = 'apps/componentLibrary/src/';
  if (!sourcePath.startsWith(sourceRoot)) {
    throw new Error(`Page recipe source must live under ${sourceRoot}: ${sourcePath}`);
  }
  const withoutRoot = sourcePath.slice(sourceRoot.length);
  const withoutExtension = withoutRoot.endsWith('.tsx')
    ? withoutRoot.slice(0, -'.tsx'.length)
    : withoutRoot;
  return `@library/${withoutExtension}`;
};

/**
 * Render the TypeScript component registry consumed by recipe routes.
 *
 * @param {PageRecipeIndex} index - Validated Page recipe index.
 * @returns {string} TypeScript module source.
 * @example
 * const source = buildGeneratedPageRecipeComponentsSource(index);
 */
export const buildGeneratedPageRecipeComponentsSource = (index) => {
  const recipes = index.groups.flatMap((group) => group.recipes);
  const imports = recipes
    .map(
      (recipe) =>
        `import { ${recipe.exportName} } from '${importPathFromDataModule(recipe.sourcePath)}';`,
    )
    .join('\n');
  const entries = recipes.map((recipe) => `  '${recipe.slug}': ${recipe.exportName},`).join('\n');

  return `/** Generated by scripts/dev/sync/buildPageRecipeIndex.mjs - do not edit. */
// biome-ignore-all format: generated registry stays byte-stable for check mode.
// biome-ignore-all assist/source/organizeImports: generated registry preserves manifest order.
import type { ComponentType } from 'react';

${imports}

export const PAGE_RECIPE_COMPONENTS: Readonly<Record<string, ComponentType>> = {
${entries}
};
`;
};

/**
 * Validate and optionally write the generated Page recipe data module.
 *
 * @param {{ repoRoot?: string, check?: boolean }} options - Build options.
 * @returns {Promise<void>} Resolves when the index is current.
 * @example
 * await buildPageRecipeIndex({ check: true });
 */
export const buildPageRecipeIndex = async ({ repoRoot = REPO_ROOT, check = false } = {}) => {
  const manifestPath = join(repoRoot, MANIFEST_PATH);
  const outPath = join(repoRoot, OUT_PATH);
  const manifest = await parseJsonFile(manifestPath);
  const index = await validatePageRecipeManifest({ repoRoot, manifest });
  const generated = buildGeneratedPageRecipeSource(index);
  const generatedComponents = buildGeneratedPageRecipeComponentsSource(index);
  const generatedGroups = buildGeneratedPageRecipeGroupsSource(index);
  const componentsPath = join(repoRoot, OUT_COMPONENTS_PATH);
  const groupsPath = join(repoRoot, OUT_GROUPS_PATH);

  if (check) {
    const existing = await readFile(outPath, 'utf8');
    if (existing !== generated) {
      throw new Error(
        `Page recipe index is out of date. Run node scripts/dev/sync/buildPageRecipeIndex.mjs`,
      );
    }
    const existingComponents = await readFile(componentsPath, 'utf8');
    if (existingComponents !== generatedComponents) {
      throw new Error(
        `Page recipe component registry is out of date. Run node scripts/dev/sync/buildPageRecipeIndex.mjs`,
      );
    }
    const existingGroups = await readFile(groupsPath, 'utf8');
    if (existingGroups !== generatedGroups) {
      throw new Error(
        `Page recipe group summaries are out of date. Run node scripts/dev/sync/buildPageRecipeIndex.mjs`,
      );
    }
    return;
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, generated, 'utf8');
  await writeFile(componentsPath, generatedComponents, 'utf8');
  await writeFile(groupsPath, generatedGroups, 'utf8');
  console.log(
    `Wrote ${OUT_PATH}, ${OUT_COMPONENTS_PATH}, and ${OUT_GROUPS_PATH} (${index.groups.length} groups)`,
  );
};

/**
 * CLI entrypoint for the Page recipe index builder.
 *
 * @returns {Promise<void>} Resolves when the command completes.
 * @example
 * await main();
 */
export const main = async () => {
  await buildPageRecipeIndex({ check: process.argv.includes('--check') });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
