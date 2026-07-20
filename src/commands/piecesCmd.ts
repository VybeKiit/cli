import process from 'node:process';
import { findPageRecipe, loadPageRecipes, type PageRecipeSummary } from '../lib/pageRecipeCatalog';
import {
  applyPageRecipeInstall,
  planPageRecipeInstall,
  resolveInstallDest,
} from '../lib/pageRecipeInstall';
import type { PageRecipeInstallPlan } from '../lib/pageRecipeInstallTypes';
import { resolveKitSource } from '../lib/resolveKitSource';
import { buildCatalog } from './pieceCatalog';
import { parsePieceFlags } from './pieceFlags';

type CommandResult = {
  readonly json: string;
  readonly exitCode: number;
};

/**
 * Load page recipes from the kit source, always cleaning up the clone.
 *
 * @returns Recipes (empty when the kit source is unavailable).
 * @example
 * const recipes = await loadRecipesFromKit();
 */
const loadRecipesFromKit = async (): Promise<readonly PageRecipeSummary[]> => {
  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await resolveKitSource();
    const { cleanup: resolvedCleanup, kitRoot } = resolved;
    cleanup = resolvedCleanup;
    return await loadPageRecipes(kitRoot);
  } catch {
    return [];
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};

/**
 * List every ready piece agents can install (DB + page recipes + backend).
 *
 * @param args - Optional `--kind=db|page-recipe|backend`.
 * @returns JSON catalog plus exit code.
 */
export const runListPieces = async (args: readonly string[] = []): Promise<CommandResult> => {
  const flags = parsePieceFlags(args);
  const recipes = await loadRecipesFromKit();
  const pieces = buildCatalog(recipes, flags.kind);

  return {
    json: JSON.stringify({ ok: true, count: pieces.length, pieces }, null, 2),
    exitCode: 0,
  };
};

/**
 * List page recipes only (manifest-backed ready screens).
 *
 * @param _args - Unused reserved args (flags ignored for symmetry).
 * @returns JSON recipe list plus exit code.
 */
export const runListPageRecipes = async (_args: readonly string[] = []): Promise<CommandResult> => {
  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await resolveKitSource();
    const { cleanup: resolvedCleanup, kitRoot } = resolved;
    cleanup = resolvedCleanup;
    const recipes = await loadPageRecipes(kitRoot);
    const rows = recipes.map((recipe) => ({
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      summary: recipe.summary,
      groupId: recipe.groupId,
      groupLabel: recipe.groupLabel,
      targetRoute: recipe.targetRoute,
      exportName: recipe.exportName,
      sourcePath: recipe.sourcePath,
      presetIds: recipe.presetIds,
      goalIds: recipe.goalIds,
      installTodos: recipe.installNotes
        .map((note) => note.todo)
        .filter((todo): todo is string => todo !== undefined && todo !== ''),
      command: `vybekiit add page-recipe ${recipe.id}`,
    }));

    return {
      json: JSON.stringify({ ok: true, count: rows.length, recipes: rows }, null, 2),
      exitCode: 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      json: JSON.stringify({ ok: false, error: message }, null, 2),
      exitCode: 1,
    };
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};

/**
 * Serialize an install plan for agent consumption.
 *
 * @param plan - Planned install.
 * @param written - Paths written (empty on dry-run).
 * @param skipped - Paths skipped because they already existed.
 * @param dryRun - Whether this was a dry run.
 * @returns JSON-serializable payload.
 * @example
 * const payload = installPayload(plan, [], [], true);
 */
const installPayload = (
  plan: PageRecipeInstallPlan,
  written: readonly string[],
  skipped: readonly string[],
  dryRun: boolean,
): Record<string, unknown> => ({
  ok: true,
  dryRun,
  recipeId: plan.recipeId,
  exportName: plan.exportName,
  targetRoute: plan.targetRoute,
  appRoot: plan.appRoot,
  componentsDir: plan.componentsDir,
  files: plan.files.map((file) => ({
    path: file.relativePath,
    kind: file.kind,
  })),
  written,
  skipped,
  linkedPresets: plan.linkedPresets,
  goalIds: plan.goalIds,
  todos: plan.todos,
  installNotes: plan.installNotes,
  acceptanceChecks: plan.acceptanceChecks,
  nextCommands: plan.nextCommands,
});

/**
 * Fail result when the recipe id is missing or unknown.
 *
 * @param error - Human-readable error message.
 * @returns JSON error payload with exit code 1.
 * @example
 * const fail = recipeError('Unknown recipe');
 */
const recipeError = (error: string): CommandResult => ({
  json: JSON.stringify({ ok: false, error }),
  exitCode: 1,
});

/**
 * Install a page recipe into a destination app folder (or dry-run the plan).
 *
 * @param args - ` <id> [--to=dir] [--dry-run] [--force] `.
 * @returns JSON install report plus exit code.
 */
export const runAddPageRecipe = async (args: readonly string[]): Promise<CommandResult> => {
  const flags = parsePieceFlags(args);
  // positionals: [0]=recipe id, [1]=optional dest when --to is omitted
  const recipeId = flags.positionals.at(0);
  const positionalTo = flags.positionals.at(1);
  let destArg: string | undefined = flags.to;
  if (destArg === undefined || destArg === '') {
    destArg = positionalTo;
  }

  if (recipeId === undefined || recipeId === '') {
    return recipeError(
      'Pass a page recipe id (e.g. cart, pricing, onboarding). Try: vybekiit list-page-recipes',
    );
  }

  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await resolveKitSource();
    const { cleanup: resolvedCleanup, kitRoot } = resolved;
    cleanup = resolvedCleanup;
    const recipes = await loadPageRecipes(kitRoot);
    if (recipes.length === 0) {
      return recipeError(
        'No page recipes found. Run inside a VybeKiit kit workspace, or ensure kit access (gh) so recipes can be loaded.',
      );
    }

    const recipe = findPageRecipe(recipes, recipeId);
    if (recipe === undefined) {
      return recipeError(`Unknown page recipe "${recipeId}". Run: vybekiit list-page-recipes`);
    }

    const dest = resolveInstallDest(destArg, process.cwd());
    const plan = await planPageRecipeInstall({ kitRoot, dest, recipe });

    if (flags.dryRun) {
      return {
        json: JSON.stringify(installPayload(plan, [], [], true), null, 2),
        exitCode: 0,
      };
    }

    const { written, skipped } = await applyPageRecipeInstall(plan, { force: flags.force });
    return {
      json: JSON.stringify(installPayload(plan, written, skipped, false), null, 2),
      exitCode: 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return recipeError(message);
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};
