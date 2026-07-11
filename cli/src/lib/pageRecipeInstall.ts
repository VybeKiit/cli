import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import type { PageRecipeSummary } from './pageRecipeCatalog';
import { rewriteInstalledSource } from './pageRecipeImports';
import type { PageRecipeInstallPlan, PlannedInstallFile } from './pageRecipeInstallTypes';
import {
  buildInstallFollowUps,
  planRouteFile,
  planSharedFiles,
  themeHelperFiles,
} from './pageRecipePlanFiles';
import { resolveAppSurface } from './resolveAppSurface';

/**
 * Check whether a path exists on disk.
 *
 * @param path - Absolute path.
 * @returns True when accessible.
 * @example
 * const ok = await pathExists('/tmp');
 */
const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Plan every file write for installing a page recipe into a destination.
 *
 * @param options - Kit root, destination, and recipe metadata.
 * @returns Install plan with file contents and agent follow-ups.
 * @example
 * const plan = await planPageRecipeInstall({ kitRoot, dest, recipe });
 */
export const planPageRecipeInstall = async (options: {
  readonly kitRoot: string;
  readonly dest: string;
  readonly recipe: PageRecipeSummary;
}): Promise<PageRecipeInstallPlan> => {
  const { kitRoot, dest, recipe } = options;
  const layout = await resolveAppSurface(dest);
  const sourceAbs = join(kitRoot, recipe.sourcePath);
  if (!(await pathExists(sourceAbs))) {
    throw new Error(
      `Recipe source not found at ${recipe.sourcePath}. Re-run from a kit workspace or with kit access.`,
    );
  }

  const recipeSource = await readFile(sourceAbs, 'utf8');
  const recipeFileName = basename(recipe.sourcePath);
  const recipeDest = join(layout.componentsDir, recipeFileName);
  const shared = await planSharedFiles({
    sourceAbs,
    recipeSource,
    appRoot: layout.appRoot,
    componentsDir: layout.componentsDir,
  });
  const routeFiles = await planRouteFile({
    appDir: layout.appDir,
    usesLocaleSegment: layout.usesLocaleSegment,
    appRoot: layout.appRoot,
    recipe,
    recipeFileName,
  });
  const followUps = buildInstallFollowUps(recipe);

  const mainFile: PlannedInstallFile = {
    absolutePath: recipeDest,
    relativePath: relative(layout.appRoot, recipeDest),
    kind: 'component',
    content: rewriteInstalledSource(recipeSource),
  };

  return {
    recipeId: recipe.id,
    appRoot: layout.appRoot,
    componentsDir: layout.componentsDir,
    targetRoute: recipe.targetRoute,
    exportName: recipe.exportName,
    files: [
      mainFile,
      ...shared.files,
      ...themeHelperFiles(layout, shared.needsThemeHelper),
      ...routeFiles,
    ],
    linkedPresets: recipe.presetIds,
    goalIds: recipe.goalIds,
    todos: followUps.todos,
    installNotes: followUps.installNotes,
    acceptanceChecks: recipe.acceptanceChecks,
    nextCommands: followUps.nextCommands,
  };
};

/**
 * Write planned install files to disk.
 *
 * @param plan - Plan from {@link planPageRecipeInstall}.
 * @param options - Force overwrite of existing files.
 * @returns Paths written and paths skipped because they already existed.
 * @example
 * const result = await applyPageRecipeInstall(plan, { force: false });
 */
export const applyPageRecipeInstall = async (
  plan: PageRecipeInstallPlan,
  options: { readonly force: boolean } = { force: false },
): Promise<{
  readonly written: readonly string[];
  readonly skipped: readonly string[];
}> => {
  const outcomes = await Promise.all(
    plan.files.map(async (file) => {
      const exists = await pathExists(file.absolutePath);
      if (exists && !options.force) {
        return { kind: 'skipped' as const, path: file.relativePath };
      }
      await mkdir(dirname(file.absolutePath), { recursive: true });
      await writeFile(file.absolutePath, file.content, 'utf8');
      return { kind: 'written' as const, path: file.relativePath };
    }),
  );

  return {
    written: outcomes.filter((row) => row.kind === 'written').map((row) => row.path),
    skipped: outcomes.filter((row) => row.kind === 'skipped').map((row) => row.path),
  };
};

/**
 * Resolve a destination path relative to cwd when needed.
 *
 * @param destArg - Optional destination from CLI.
 * @param cwd - Process working directory.
 * @returns Absolute destination directory.
 * @example
 * const dest = resolveInstallDest('./apps/web', process.cwd());
 */
export const resolveInstallDest = (destArg: string | undefined, cwd: string): string => {
  if (destArg === undefined || destArg === '') {
    return resolve(cwd);
  }
  return resolve(cwd, destArg);
};
