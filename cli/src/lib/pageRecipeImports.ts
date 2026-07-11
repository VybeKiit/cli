// Match `from './shared/Foo'` or parent-relative `from '../shared/Foo'` (folder recipes).
// match example: from '../shared/DemoThemeRandomizer' → capture group 1 = ../shared/DemoThemeRandomizer
const SHARED_IMPORT_PATTERN = /from\s+['"]((?:\.\.\/)+shared\/[^'"]+|\.\/shared\/[^'"]+)['"]/g;

// Match other relative imports inside shared modules (e.g. `from './DemoActionButton'`).
// match example: from './DemoActionButton' → capture group 1 = ./DemoActionButton
const RELATIVE_IMPORT_PATTERN = /from\s+['"](\.\/[^'"]+)['"]/g;

/**
 * Drop a leading `./` from a relative import specifier.
 * `./shared/Foo` → `shared/Foo`, `./Demo` → `Demo`.
 *
 * @param spec - Relative import path that may start with `./`.
 * @returns Specifier without a leading `./`.
 * @example
 * const rel = stripLeadingDotSlash('./shared/Foo');
 */
export const stripLeadingDotSlash = (spec: string): string => {
  if (spec.startsWith('./')) {
    return spec.slice(2);
  }
  return spec;
};

/**
 * Module basename under `pageRecipes/shared/` for a shared import specifier.
 * `./shared/DemoPlugInPanel` → `DemoPlugInPanel`, `../shared/formatUsdCents` → `formatUsdCents`.
 *
 * @param spec - Relative shared import (with or without `./` / `../` prefixes).
 * @returns File stem under the kit shared folder.
 * @example
 * const name = sharedModuleName('../shared/DemoRecipeFrame');
 */
export const sharedModuleName = (spec: string): string => {
  const normalized = spec.replaceAll('\\', '/');
  const marker = '/shared/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + marker.length);
  }
  if (normalized.startsWith('shared/')) {
    return normalized.slice('shared/'.length);
  }
  return basenameWithoutDirs(normalized);
};

/**
 * Last path segment of a relative import (no dirs).
 *
 * @param pathLike - Relative path.
 * @returns Final segment.
 */
const basenameWithoutDirs = (pathLike: string): string => {
  const parts = pathLike.split('/');
  const last = parts[parts.length - 1];
  return last === undefined || last === '' ? pathLike : last;
};

/**
 * Drop a trailing `.ts` / `.tsx` extension for import-path aliases.
 * `CartPage.tsx` → `CartPage`, `themeHelpers.ts` → `themeHelpers`.
 *
 * @param fileName - Component file name, with or without extension.
 * @returns Base name without a TypeScript extension.
 * @example
 * const base = stripComponentExtension('CartPage.tsx');
 */
export const stripComponentExtension = (fileName: string): string => {
  if (fileName.endsWith('.tsx')) {
    return fileName.slice(0, -'.tsx'.length);
  }
  if (fileName.endsWith('.ts')) {
    return fileName.slice(0, -'.ts'.length);
  }
  return fileName;
};

/**
 * Collect shared-module import basenames from recipe source (`./shared/…` or `../shared/…`).
 *
 * @param source - TypeScript/TSX source text.
 * @returns Shared module stems (e.g. `DemoThemeRandomizer`), de-duplicated.
 * @example
 * const imports = collectSharedImports(source);
 */
export const collectSharedImports = (source: string): readonly string[] => {
  const found = new Set<string>();
  for (const match of source.matchAll(SHARED_IMPORT_PATTERN)) {
    // capture group 1: the relative `…/shared/…` import path (see SHARED_IMPORT_PATTERN)
    const [, sharedSpecifier] = match;
    if (sharedSpecifier !== undefined) {
      found.add(sharedModuleName(sharedSpecifier));
    }
  }
  return [...found];
};

/**
 * Collect same-folder relative imports from a shared module (no `./shared/` prefix).
 *
 * @param source - Shared module source text.
 * @returns Specifiers like `./DemoActionButton`.
 * @example
 * const rel = collectRelativeImports(source);
 */
export const collectRelativeImports = (source: string): readonly string[] => {
  const found = new Set<string>();
  for (const match of source.matchAll(RELATIVE_IMPORT_PATTERN)) {
    // capture group 1: relative specifier like `./DemoActionButton` (see RELATIVE_IMPORT_PATTERN)
    const [, relativeSpecifier] = match;
    if (
      relativeSpecifier !== undefined &&
      !relativeSpecifier.startsWith('./shared/') &&
      relativeSpecifier.startsWith('./')
    ) {
      found.add(relativeSpecifier);
    }
  }
  return [...found];
};

/**
 * Rewrite gallery-only imports so installed files resolve inside a buyer app.
 *
 * @param source - Original file contents.
 * @returns Source with `@library/lib/theme` remapped to local helpers.
 * @example
 * const next = rewriteInstalledSource(raw);
 */
export const rewriteInstalledSource = (source: string): string =>
  // Gallery-only theme import → local helper installed next to the recipe.
  // from '@library/lib/theme' → from './themeHelpers' (single- and double-quoted forms)
  // Folder recipes use `../shared/…`; installed layout is flat → `./shared/…`.
  source
    .replaceAll("from '@library/lib/theme'", "from './themeHelpers'")
    .replaceAll('from "@library/lib/theme"', "from './themeHelpers'")
    // from '../shared/Foo' or from "../../shared/Foo" → from './shared/Foo' / from "./shared/Foo"
    .replaceAll(/from\s+(['"])(?:\.\.\/)+shared\//g, 'from $1./shared/');
