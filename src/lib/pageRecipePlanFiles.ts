import { access, readFile } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import type { AppSurfaceLayout } from './appSurface';
import { routeSegmentPath } from './appSurface';
import type { PageRecipeSummary } from './pageRecipeCatalog';
import {
  collectRelativeImports,
  collectSharedImports,
  rewriteInstalledSource,
  stripComponentExtension,
  stripLeadingDotSlash,
} from './pageRecipeImports';
import type { PlannedInstallFile } from './pageRecipeInstallTypes';
import { pageRecipeRouteStub } from './pageRecipeRouteStub';
import { THEME_HELPER_SOURCE } from './pageRecipeThemeHelper';

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
 * Resolve a source file path that may omit the `.tsx` / `.ts` extension.
 *
 * @param basePath - Path without or with extension.
 * @returns Absolute path that exists, or null.
 * @example
 * const file = await existingSourceFile('/repo/apps/.../DemoThemeRandomizer');
 */
const existingSourceFile = async (basePath: string): Promise<string | null> => {
  const candidates = [
    basePath,
    `${basePath}.tsx`,
    `${basePath}.ts`,
    `${basePath}.jsx`,
    `${basePath}.js`,
  ];
  const hits = await Promise.all(
    candidates.map(async (candidate) => ({
      candidate,
      exists: await pathExists(candidate),
    })),
  );
  const hit = hits.find((entry) => entry.exists);
  if (hit === undefined) {
    return null;
  }
  return hit.candidate;
};

/**
 * Load one shared module and queue its local relatives.
 *
 * @param options - Spec + kit/destination paths.
 * @returns Planned shared file and newly discovered relative specs.
 * @example
 * const step = await loadSharedModule({ spec, sourceAbs, appRoot, componentsDir });
 */
/**
 * Locate the kit `pageRecipes/shared` directory by walking up from a recipe file.
 *
 * @param fromFile - Absolute path of the recipe source (may live in a subfolder).
 * @returns Absolute path to the shared directory, or null.
 */
const findKitSharedDir = async (fromFile: string): Promise<string | null> => {
  let dir = dirname(fromFile);
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = join(dir, 'shared');
    if (await pathExists(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
  return null;
};

const loadSharedModule = async (options: {
  readonly spec: string;
  readonly sourceAbs: string;
  readonly appRoot: string;
  readonly componentsDir: string;
  readonly kitSharedDir: string;
}): Promise<{
  readonly file: PlannedInstallFile;
  readonly rewroteTheme: boolean;
  readonly nextSpecs: readonly string[];
}> => {
  const { spec, appRoot, componentsDir, kitSharedDir } = options;
  // `spec` is a shared module stem (e.g. DemoPlugInPanel) after collectSharedImports.
  const kitSharedBase = join(kitSharedDir, stripLeadingDotSlash(spec));
  const kitSharedFile = await existingSourceFile(kitSharedBase);
  if (kitSharedFile === null) {
    throw new Error(`Missing shared recipe dependency: ${spec}`);
  }

  const sharedDest = join(componentsDir, 'shared', basename(kitSharedFile));
  const sharedRaw = await readFile(kitSharedFile, 'utf8');
  const sharedContent = rewriteInstalledSource(sharedRaw);
  const nextSpecs = collectRelativeImports(sharedRaw).map((rel) => stripLeadingDotSlash(rel));

  return {
    file: {
      absolutePath: sharedDest,
      relativePath: relative(appRoot, sharedDest),
      kind: 'shared',
      content: sharedContent,
    },
    rewroteTheme: sharedContent !== sharedRaw,
    nextSpecs,
  };
};

/**
 * Walk shared import graph one module at a time (deps may enqueue more).
 *
 * @param options - Queue + accumulated plan state.
 * @returns Planned shared files and theme-helper flag.
 * @example
 * const walked = await walkSharedQueue({ queue, seen, files, ... });
 */
const walkSharedQueue = async (options: {
  readonly queue: readonly string[];
  readonly seen: ReadonlySet<string>;
  readonly files: readonly PlannedInstallFile[];
  readonly needsThemeHelper: boolean;
  readonly sourceAbs: string;
  readonly appRoot: string;
  readonly componentsDir: string;
  readonly kitSharedDir: string;
}): Promise<{
  readonly files: readonly PlannedInstallFile[];
  readonly needsThemeHelper: boolean;
}> => {
  const { queue, seen, files, needsThemeHelper, sourceAbs, appRoot, componentsDir, kitSharedDir } =
    options;
  // queue head: shared module stem (e.g. `DemoThemeRandomizer`)
  const [spec, ...rest] = queue;
  if (spec === undefined) {
    return { files, needsThemeHelper };
  }
  if (seen.has(spec)) {
    return walkSharedQueue({
      queue: rest,
      seen,
      files,
      needsThemeHelper,
      sourceAbs,
      appRoot,
      componentsDir,
      kitSharedDir,
    });
  }

  const step = await loadSharedModule({
    spec,
    sourceAbs,
    appRoot,
    componentsDir,
    kitSharedDir,
  });
  const nextSeen = new Set(seen);
  nextSeen.add(spec);
  const enqueued = step.nextSpecs.filter((nextSpec) => !nextSeen.has(nextSpec));

  return walkSharedQueue({
    queue: [...rest, ...enqueued],
    seen: nextSeen,
    files: [...files, step.file],
    needsThemeHelper: needsThemeHelper || step.rewroteTheme,
    sourceAbs,
    appRoot,
    componentsDir,
    kitSharedDir,
  });
};

/**
 * Plan shared-module copies for a recipe, walking the import graph.
 *
 * @param options - Kit recipe source path and destination components dir.
 * @returns Shared files to write plus whether a theme helper is needed.
 * @example
 * const shared = await planSharedFiles({ sourceAbs, recipeSource, layout });
 */
export const planSharedFiles = async (options: {
  readonly sourceAbs: string;
  readonly recipeSource: string;
  readonly appRoot: string;
  readonly componentsDir: string;
}): Promise<{
  readonly files: readonly PlannedInstallFile[];
  readonly needsThemeHelper: boolean;
}> => {
  const { sourceAbs, recipeSource, appRoot, componentsDir } = options;
  const kitSharedDir = await findKitSharedDir(sourceAbs);
  if (kitSharedDir === null) {
    return {
      files: [],
      needsThemeHelper: rewriteInstalledSource(recipeSource) !== recipeSource,
    };
  }
  return walkSharedQueue({
    queue: [...collectSharedImports(recipeSource)],
    seen: new Set<string>(),
    files: [],
    needsThemeHelper: rewriteInstalledSource(recipeSource) !== recipeSource,
    sourceAbs,
    appRoot,
    componentsDir,
    kitSharedDir,
  });
};

/**
 * Optionally plan a Next.js route page when the dest has an `app/` directory.
 *
 * @param options - Layout + recipe metadata for the route file.
 * @returns Zero or one planned route file.
 * @example
 * const routes = await planRouteFile({ layout, recipe, recipeFileName });
 */
export const planRouteFile = async (options: {
  readonly appDir: string | undefined;
  readonly usesLocaleSegment: boolean;
  readonly appRoot: string;
  readonly recipe: PageRecipeSummary;
  readonly recipeFileName: string;
}): Promise<readonly PlannedInstallFile[]> => {
  const { appDir, usesLocaleSegment, appRoot, recipe, recipeFileName } = options;
  if (appDir === undefined) {
    return [];
  }
  const segment = routeSegmentPath(recipe.targetRoute, usesLocaleSegment);
  const routeFile = join(appDir, segment, 'page.tsx');
  const importPath = `@/components/pageRecipes/${stripComponentExtension(recipeFileName)}`;
  // Only plan a new route when missing — never clobber an existing buyer page unless force.
  if (await pathExists(routeFile)) {
    return [];
  }
  return [
    {
      absolutePath: routeFile,
      relativePath: relative(appRoot, routeFile),
      kind: 'route',
      content: pageRecipeRouteStub(recipe.exportName, importPath, recipe.targetRoute),
    },
  ];
};

/**
 * Theme helper file when any installed source rewrote `@library/lib/theme`.
 *
 * @param layout - Destination app layout.
 * @param needsThemeHelper - Whether the helper is required.
 * @returns Zero or one planned theme helper file.
 * @example
 * const helpers = themeHelperFiles(layout, true);
 */
export const themeHelperFiles = (
  layout: AppSurfaceLayout,
  needsThemeHelper: boolean,
): readonly PlannedInstallFile[] => {
  if (!needsThemeHelper) {
    return [];
  }
  const helperDest = join(layout.componentsDir, 'shared', 'themeHelpers.ts');
  return [
    {
      absolutePath: helperDest,
      relativePath: relative(layout.appRoot, helperDest),
      kind: 'theme-helper',
      content: THEME_HELPER_SOURCE,
    },
  ];
};

/**
 * Build agent follow-up commands and todos for an install plan.
 *
 * @param recipe - Installed recipe metadata.
 * @returns Todos, notes, and next commands.
 * @example
 * const followUps = pageRecipeInstallFollowUps(recipe);
 */
export const pageRecipeInstallFollowUps = (
  recipe: PageRecipeSummary,
): {
  readonly todos: readonly string[];
  readonly installNotes: readonly string[];
  readonly nextCommands: readonly string[];
} => {
  const todos = recipe.installNotes
    .map((note) => note.todo)
    .filter((todo): todo is string => todo !== undefined && todo !== '');
  const installNotes = recipe.installNotes.map((note) => `${note.label}: ${note.note}`);
  // First linked skill goal drives the single agent follow-up hint (if any).
  const firstGoalId = recipe.goalIds.at(0);
  const goalFollowUp =
    firstGoalId === undefined ? [] : [`Ask your coding tool: run the "${firstGoalId}" skill`];
  return {
    todos,
    installNotes,
    nextCommands: [
      ...recipe.presetIds.map((presetId) => `vybekiit apply-preset ${presetId}`),
      ...goalFollowUp,
    ],
  };
};
