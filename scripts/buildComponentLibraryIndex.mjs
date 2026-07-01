#!/usr/bin/env node
/**
 * Generate component library catalog + preview loaders for apps/componentLibrary
 */

import { access, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CATALOG_PATH = join(REPO_ROOT, 'templates/web/.vybekiit/agent/ui-catalog-index.json');
const OUT_CATALOG = join(REPO_ROOT, 'apps/componentLibrary/src/data/catalog.ts');
const OUT_CLIENT_LOAD = join(REPO_ROOT, 'apps/componentLibrary/src/lib/loadPreview.client.ts');
const WEB_ROOT = join(REPO_ROOT, 'templates/web');
const DEMOS_ROOT = join(REPO_ROOT, 'apps/componentLibrary/src/demos');
const LIB_PKG_PATH = join(REPO_ROOT, 'apps/componentLibrary/package.json');

/** Hand-curated demos — never auto-deleted or overwritten. */
const MANUAL_DEMOS = new Set(['aceternity/google-gemini-effect']);

/** @type {Set<string> | null} */
let allowedPackages = null;

async function getAllowedPackages() {
  if (allowedPackages) {
    return allowedPackages;
  }
  const webPkg = JSON.parse(await readFile(join(WEB_ROOT, 'package.json'), 'utf8'));
  const libPkg = JSON.parse(await readFile(LIB_PKG_PATH, 'utf8'));
  allowedPackages = new Set([
    ...Object.keys(webPkg.dependencies ?? {}),
    ...Object.keys(webPkg.devDependencies ?? {}),
    ...Object.keys(libPkg.dependencies ?? {}),
    ...Object.keys(libPkg.devDependencies ?? {}),
  ]);
  return allowedPackages;
}

/**
 * @param {string} specifier
 */
function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return `${scope}/${name}`;
  }
  return specifier.split('/')[0] ?? specifier;
}

/** Examples that need API keys or live backend — preview shows controlled fallback. */
const API_KEY_EXAMPLES = new Set([
  'example-demo-claude',
  'example-demo-chatgpt',
  'example-demo-cursor',
  'example-demo-grok',
  'example-v0-clone',
  'example-chatbot',
]);

/** Namespaces excluded from auto demo generation (handled separately). */
const AUTO_DEMO_SKIP_NAMESPACES = new Set([]);

/**
 * Import patterns that genuinely break an isolated preview build: native/WebGL
 * runtimes and deps that aren't installed. A missing `@/components/ui/*` primitive
 * is NOT listed here — it's caught for real by resolving the alias against the
 * mirror (isBuildSafeShallow), so every primitive that actually exists is allowed.
 */
const BROKEN_IMPORT_PATTERNS = [
  /react-native/,
  /react-syntax-highlighter/,
  /@icons-pack\//,
  /@shikijs\//,
  /from ['"]three['"]/,
  /three-globe/,
  /@react-three\//,
];

/**
 * @param {string} importPath
 */
function importPathToFile(importPath) {
  return join(WEB_ROOT, importPath.replace(/^@\//, 'src/'));
}

/**
 * @param {string} importPath
 */
async function mirrorFileExists(importPath) {
  const base = importPathToFile(importPath);
  try {
    await access(`${base}.tsx`);
    return true;
  } catch {
    try {
      await access(join(base, 'index.tsx'));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @param {string} namespace
 * @param {string} name
 */
function demoPath(namespace, name) {
  return join(DEMOS_ROOT, namespace, `${name}.tsx`);
}

/**
 * @param {string} namespace
 * @param {string} name
 */
async function demoExists(namespace, name) {
  try {
    await access(demoPath(namespace, name));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} namespace
 * @param {string} name
 */
function previewKey(namespace, name) {
  return `${namespace}/${name}`;
}

/**
 * @param {string} namespace
 * @param {string} componentName
 * @param {Set<string>} exampleNames
 */
function findUpstreamExampleName(namespace, componentName, exampleNames) {
  const names = [...exampleNames];
  if (namespace === 'magicui') {
    return (
      names.find((n) => n === `${componentName}-demo`) ??
      names.find((n) => n.startsWith(`${componentName}-demo`))
    );
  }
  if (namespace === 'ai-elements') {
    return names.find((n) => n === `example-${componentName}`);
  }
  if (namespace === 'bundui') {
    return (
      names.find((n) => n === `${componentName}-default`) ??
      names.find((n) => n.startsWith(`${componentName}-`))
    );
  }
  return null;
}

/**
 * @param {string} namespace
 * @param {string} name
 */
async function isSimpleComponent(namespace, name) {
  const mirrorFile = `${importPathToFile(`@/components/${namespace}/${name}`)}.tsx`;
  let content;
  try {
    content = await readFile(mirrorFile, 'utf8');
  } catch {
    return false;
  }
  if (BROKEN_IMPORT_PATTERNS.some((pattern) => pattern.test(content))) {
    return false;
  }
  // Framer Motion (useScroll/useTransform/MotionValue), createContext, and refs all
  // render fine in an isolated preview — the only real blockers are the native/WebGL
  // imports above and unresolved deps, both covered by isBuildSafeShallow.
  return isBuildSafeShallow(mirrorFile);
}

/**
 * @param {string} namespace
 * @param {string} name
 * @param {'upstream' | 'generated'} source
 * @param {string} [upstreamExampleName]
 */
async function writeDemoWrapper(namespace, name, source, upstreamExampleName) {
  const path = demoPath(namespace, name);
  await mkdir(dirname(path), { recursive: true });
  if (source === 'upstream' && upstreamExampleName) {
    const content = `'use client';

export { default } from '@/components/${namespace}/${upstreamExampleName}';
`;
    await writeFile(path, content, 'utf8');
    return;
  }
  // Prefer a real default import when the mirror has one (clean, no webpack warning);
  // otherwise scan named exports for the first component. Reading `Mirror.default` on a
  // named-only module is what produced the "does not contain a default export" warnings.
  const mirrorFile = `${importPathToFile(`@/components/${namespace}/${name}`)}.tsx`;
  let mirrorContent = '';
  try {
    mirrorContent = await readFile(mirrorFile, 'utf8');
  } catch {
    // fall through to the named-export wrapper
  }
  const content = /export\s+default/.test(mirrorContent)
    ? `'use client';

import Component from '@/components/${namespace}/${name}';

export default function ${toPascalCase(name)}Preview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Component />
    </div>
  );
}
`
    : `'use client';

import type { ComponentType } from 'react';
import * as Mirror from '@/components/${namespace}/${name}';

const Component = Object.values(Mirror).find(
  (value): value is ComponentType<object> => typeof value === 'function',
);

export default function ${toPascalCase(name)}Preview() {
  if (!Component) {
    return null;
  }
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Component />
    </div>
  );
}
`;
  await writeFile(path, content, 'utf8');
}

/**
 * @param {string} name
 */
function toPascalCase(name) {
  const result = name
    .split(/[-_/]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return /^[0-9]/.test(result) ? `Demo${result}` : result;
}

/**
 * @param {Array<Record<string, unknown>>} rawComponents
 * @returns {Promise<Map<string, 'manual' | 'upstream' | 'generated'>>}
 */
async function ensureDemoWrappers(rawComponents) {
  /** @type {Map<string, 'manual' | 'upstream' | 'generated'>} */
  const demoSources = new Map();
  /** @type {Map<string, Set<string>>} */
  const exampleNamesByNs = new Map();

  for (const raw of rawComponents) {
    const namespace = String(raw.namespace ?? raw.source ?? '');
    const name = String(raw.name ?? '');
    const kind =
      raw.kind === 'example' || name.startsWith('example-') || /-demo(-\d+)?$/.test(name)
        ? 'example'
        : 'component';
    if (kind === 'example') {
      if (!exampleNamesByNs.has(namespace)) {
        exampleNamesByNs.set(namespace, new Set());
      }
      exampleNamesByNs.get(namespace)?.add(name);
    }
  }

  for (const raw of rawComponents) {
    const namespace = String(raw.namespace ?? raw.source ?? '');
    const name = String(raw.name ?? '');
    const kind =
      raw.kind === 'example' || name.startsWith('example-') || /-demo(-\d+)?$/.test(name)
        ? 'example'
        : 'component';
    if (kind !== 'component' || AUTO_DEMO_SKIP_NAMESPACES.has(namespace) || /^[0-9]/.test(name)) {
      continue;
    }

    const key = previewKey(namespace, name);
    const demoFile = demoPath(namespace, name);

    if (MANUAL_DEMOS.has(key)) {
      demoSources.set(key, 'manual');
      continue;
    }

    if (await demoExists(namespace, name)) {
      const content = await readFile(demoFile, 'utf8');
      if (content.includes("export { default } from '@/components/")) {
        const match = content.match(/from '@\/components\/([^']+)'/);
        const exampleFile = match?.[1]
          ? `${importPathToFile(`@/components/${match[1]}`)}.tsx`
          : null;
        const valid = exampleFile && (await isBuildSafeExample(exampleFile).catch(() => false));
        if (valid) {
          demoSources.set(key, 'upstream');
          continue;
        }
        await unlink(demoFile).catch(() => {});
      } else {
        const valid = await isBuildSafeShallow(demoFile).catch(() => false);
        if (valid) {
          demoSources.set(key, 'generated');
          continue;
        }
        await unlink(demoFile).catch(() => {});
      }
    }

    const upstream = findUpstreamExampleName(
      namespace,
      name,
      exampleNamesByNs.get(namespace) ?? new Set(),
    );
    if (upstream) {
      const exampleFile = `${importPathToFile(`@/components/${namespace}/${upstream}`)}.tsx`;
      if (await isBuildSafeExample(exampleFile).catch(() => false)) {
        await writeDemoWrapper(namespace, name, 'upstream', upstream);
        demoSources.set(key, 'upstream');
      }
      continue;
    }

    if (await isSimpleComponent(namespace, name)) {
      await writeDemoWrapper(namespace, name, 'generated');
      demoSources.set(key, 'generated');
    }
  }

  return demoSources;
}

/**
 * @param {Record<string, unknown>} entry
 * @param {boolean} hasDemo
 */
function inferRenderMode(entry, hasDemo) {
  const name = String(entry.name ?? '');
  const kind = entry.kind === 'example' ? 'example' : 'component';
  if (kind === 'example' || name.startsWith('example-') || /-demo(-\d+)?$/.test(name)) {
    return 'example';
  }
  if (hasDemo) {
    return 'demo';
  }
  return 'auto';
}

/**
 * @param {string} basePath without extension
 */
async function resolveModuleFile(basePath) {
  for (const suffix of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
    try {
      await access(`${basePath}${suffix}`);
      return `${basePath}${suffix}`;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * @param {string} filePath
 */
async function resolveRelativeImport(filePath, specifier) {
  const dir = dirname(filePath);
  const normalized = specifier.replace(/\.tsx?$/, '');
  return resolveModuleFile(pathResolve(dir, normalized));
}

/**
 * @param {string} importPath e.g. @/components/foo/bar
 */
async function resolveAliasImport(importPath) {
  return resolveModuleFile(importPathToFile(importPath));
}

/**
 * @param {string} targetContent
 * @param {string} exportName
 */
function exportsSymbol(targetContent, exportName) {
  return (
    new RegExp(`export\\s+(?:const|function|class|type|interface)\\s+${exportName}\\b`).test(
      targetContent,
    ) || new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b`).test(targetContent)
  );
}

/**
 * @param {string} filePath
 * @param {string} content
 */
async function hasValidNamedImports(filePath, content) {
  const namedImports = [...content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)];
  for (const [, rawNames, specifier] of namedImports) {
    if (specifier.startsWith('.')) {
      const resolved = await resolveRelativeImport(filePath, specifier);
      if (!resolved) {
        return false;
      }
      const targetContent = await readFile(resolved, 'utf8');
      for (const token of rawNames.split(',')) {
        const cleaned = token.trim().replace(/^type\s+/, '');
        const exportName = cleaned.split(/\s+as\s+/)[0]?.trim();
        if (!exportName) {
          continue;
        }
        if (!exportsSymbol(targetContent, exportName)) {
          return false;
        }
      }
      continue;
    }

    if (!specifier.startsWith('@/')) {
      continue;
    }

    const normalized = specifier
      .replace(/^@\/registry\/default\/ui\//, '@/components/ui/')
      .replace(/^@\/registry\/new-york\/ui\//, '@/components/ui/');
    const resolved = await resolveAliasImport(normalized);
    if (!resolved) {
      return false;
    }
    const targetContent = await readFile(resolved, 'utf8');
    for (const token of rawNames.split(',')) {
      const cleaned = token.trim().replace(/^type\s+/, '');
      const exportName = cleaned.split(/\s+as\s+/)[0]?.trim();
      if (!exportName) {
        continue;
      }
      if (!exportsSymbol(targetContent, exportName)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {string} filePath
 * @param {Set<string>} [visited]
 */
async function isBuildSafeFile(filePath, visited = new Set()) {
  if (visited.has(filePath)) {
    return true;
  }
  visited.add(filePath);

  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch {
    return false;
  }

  if (BROKEN_IMPORT_PATTERNS.some((pattern) => pattern.test(content))) {
    return false;
  }

  if (!(await hasValidNamedImports(filePath, content))) {
    return false;
  }

  const allowed = await getAllowedPackages();
  const externalImports = [
    ...content.matchAll(/from ['"]([^'"]+)['"]/g),
    ...content.matchAll(/import ['"]([^'"]+)['"]/g),
  ].map((match) => match[1]);

  for (const specifier of externalImports) {
    if (specifier.startsWith('.') || specifier.startsWith('@/')) {
      continue;
    }
    const pkg = packageNameFromSpecifier(specifier);
    if (!allowed.has(pkg)) {
      return false;
    }
  }

  const relativeImports = [...content.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)].map((m) => m[1]);
  for (const rel of relativeImports) {
    const resolved = await resolveRelativeImport(filePath, rel);
    if (!resolved) {
      return false;
    }
    if (!(await isBuildSafeFile(resolved, visited))) {
      return false;
    }
  }

  const aliasImports = [...content.matchAll(/from ['"](@\/[^'"]+|@repo\/[^'"]+)['"]/g)].map(
    (m) => m[1],
  );
  for (const alias of aliasImports) {
    if (alias.startsWith('@repo/')) {
      return false;
    }

    if (alias.startsWith('@/')) {
      const normalized = alias
        .replace(/^@\/registry\/default\/ui\//, '@/components/ui/')
        .replace(/^@\/registry\/new-york\/ui\//, '@/components/ui/');
      const resolved = await resolveAliasImport(normalized);
      if (!resolved) {
        return false;
      }
      if (!(await isBuildSafeFile(resolved, visited))) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Example demos: validate the file plus one level of @/components imports.
 * @param {string} filePath
 */
async function isBuildSafeExample(filePath) {
  if (!(await isBuildSafeShallow(filePath))) {
    return false;
  }

  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch {
    return false;
  }

  const componentImports = [...content.matchAll(/from ['"](@\/components\/[^'"]+)['"]/g)].map(
    (match) => match[1],
  );

  for (const alias of componentImports) {
    const resolved = await resolveAliasImport(alias);
    if (!resolved) {
      return false;
    }
    if (!(await isBuildSafeShallow(resolved))) {
      return false;
    }
  }

  return true;
}

/**
 * Shallow safety check for example demos — defers deep dependency validation to runtime/build.
 * @param {string} filePath
 */
async function isBuildSafeShallow(filePath) {
  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch {
    return false;
  }

  if (BROKEN_IMPORT_PATTERNS.some((pattern) => pattern.test(content))) {
    return false;
  }

  if (!(await hasValidNamedImports(filePath, content))) {
    return false;
  }

  const allowed = await getAllowedPackages();
  const externalImports = [
    ...content.matchAll(/from ['"]([^'"]+)['"]/g),
    ...content.matchAll(/import ['"]([^'"]+)['"]/g),
  ].map((match) => match[1]);

  for (const specifier of externalImports) {
    if (specifier.startsWith('.') || specifier.startsWith('@/')) {
      continue;
    }
    const pkg = packageNameFromSpecifier(specifier);
    if (!allowed.has(pkg)) {
      return false;
    }
  }

  const relativeImports = [...content.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)].map((m) => m[1]);
  for (const rel of relativeImports) {
    const resolved = await resolveRelativeImport(filePath, rel);
    if (!resolved) {
      return false;
    }
  }

  const aliasImports = [...content.matchAll(/from ['"](@\/[^'"]+|@repo\/[^'"]+)['"]/g)].map(
    (m) => m[1],
  );
  for (const alias of aliasImports) {
    if (alias.startsWith('@repo/')) {
      return false;
    }
    if (alias.startsWith('@/')) {
      const normalized = alias
        .replace(/^@\/registry\/default\/ui\//, '@/components/ui/')
        .replace(/^@\/registry\/new-york\/ui\//, '@/components/ui/');
      const resolved = await resolveAliasImport(normalized);
      if (!resolved) {
        return false;
      }
    }
  }

  return true;
}

/**
 * @param {string} filePath
 */
async function isBuildSafeImport(filePath) {
  return isBuildSafeFile(filePath);
}

/**
 * @param {string} namespace
 * @param {string} name
 * @param {string} demoFile
 * @param {Map<string, 'manual' | 'upstream' | 'generated'>} demoSources
 */
async function isDemoBuildSafe(namespace, name, demoFile, demoSources) {
  const source = demoSources.get(previewKey(namespace, name));
  if (source === 'upstream') {
    const content = await readFile(demoFile, 'utf8');
    const match = content.match(/from '@\/components\/([^']+)'/);
    if (match?.[1]) {
      const exampleFile = `${importPathToFile(`@/components/${match[1]}`)}.tsx`;
      return isBuildSafeExample(exampleFile);
    }
  }
  if (source === 'generated') {
    const mirrorFile = `${importPathToFile(`@/components/${namespace}/${name}`)}.tsx`;
    return isBuildSafeShallow(demoFile) && (await isBuildSafeShallow(mirrorFile));
  }
  return isBuildSafeShallow(demoFile);
}

/**
 * Why an entry can't render a live preview — drives honest gallery copy instead of a
 * vague "no demo yet". Native/WebGL renders in an app but not the isolated gallery;
 * `deps` needs packages the web template doesn't install; `env` needs API keys.
 * @param {string} mirrorFile
 * @param {boolean} requiresEnv
 * @returns {Promise<'env' | 'native' | 'deps' | 'nodemo'>}
 */
async function classifyUnavailable(mirrorFile, requiresEnv) {
  if (requiresEnv) {
    return 'env';
  }
  let content;
  try {
    content = await readFile(mirrorFile, 'utf8');
  } catch {
    return 'nodemo';
  }
  // native/WebGL runtimes: match `react-native`, `from 'three'`, `@react-three/`
  if (/react-native|from ['"]three['"]|@react-three\//.test(content)) {
    return 'native';
  }
  const allowed = await getAllowedPackages();
  const externals = [...content.matchAll(/from ['"]([^'"]+)['"]/g)]
    .map((match) => match[1])
    .filter((spec) => !(spec.startsWith('.') || spec.startsWith('@/')));
  for (const spec of externals) {
    if (spec.startsWith('@repo/') || !allowed.has(packageNameFromSpecifier(spec))) {
      return 'deps';
    }
  }
  return 'nodemo';
}

/**
 * @param {Record<string, unknown>} raw
 * @param {Map<string, 'manual' | 'upstream' | 'generated'>} demoSources
 */
async function toCatalogEntry(raw, demoSources) {
  const namespace = String(raw.namespace ?? raw.source ?? 'unknown');
  const name = String(raw.name ?? 'unknown');
  const paths = raw.paths ?? [];
  const primaryPath = Array.isArray(paths) && paths.length > 0 ? String(paths[0]) : '';
  const importPath = primaryPath
    ? `@/${primaryPath.replace(/^src\//, '').replace(/\.tsx$/, '')}`
    : `@/components/${namespace}/${name}`;

  // Storybook artifacts (untitled ships *.demo.tsx / *.story.tsx) aren't catalog
  // components — drop them. Examples use a `-demo` suffix, not a `.demo` extension.
  if (/\.(story|demo)\.tsx$/.test(primaryPath)) {
    return null;
  }

  const kind =
    raw.kind === 'example' || name.startsWith('example-') || /-demo(-\d+)?$/.test(name)
      ? 'example'
      : 'component';
  const hasDemo = kind === 'component' ? await demoExists(namespace, name) : false;
  const renderMode = inferRenderMode({ name, kind }, hasDemo);
  const fileExists = await mirrorFileExists(importPath);
  // Prune phantom entries: listed in the registry catalog index but never synced into
  // the mirror (the untitled/kibo/gluestack dirs are empty). No source file = nothing
  // a buyer could scaffold and nothing to preview, so drop it rather than ship a
  // dead placeholder.
  if (!fileExists) {
    return null;
  }
  const mirrorFile = `${importPathToFile(importPath)}.tsx`;
  const demoFile = demoPath(namespace, name);
  const demoBuildSafe = hasDemo
    ? await isDemoBuildSafe(namespace, name, demoFile, demoSources).catch(() => false)
    : false;

  const exampleBuildSafe =
    fileExists &&
    !API_KEY_EXAMPLES.has(name) &&
    (await isBuildSafeExample(mirrorFile).catch(() => false));

  const componentPreviewable =
    fileExists && hasDemo && demoBuildSafe && !API_KEY_EXAMPLES.has(name);

  const previewable = kind === 'example' ? exampleBuildSafe : componentPreviewable;
  const buildSafe = previewable;
  const requiresEnv = API_KEY_EXAMPLES.has(name);
  const unavailableReason = previewable
    ? undefined
    : await classifyUnavailable(mirrorFile, requiresEnv);
  const demoSource = demoSources.get(previewKey(namespace, name));

  return {
    source: String(raw.source ?? namespace),
    namespace,
    name,
    previewKey: previewKey(namespace, name),
    importPath,
    category: String(raw.category ?? 'component'),
    kind,
    renderMode,
    previewable,
    buildSafe,
    requiresEnv,
    unavailableReason,
    demoSource: demoSource ?? undefined,
    relatedExamples: [],
    tags: raw.tags ?? [],
    portable: raw.portable === true,
  };
}

/**
 * @param {{ previewKey: string, renderMode: string, importPath: string, namespace: string, name: string, buildSafe: boolean }} entry
 */
function serverLoadCase(entry) {
  if (!entry.buildSafe) {
    return null;
  }
  if (entry.renderMode === 'demo') {
    return `    case '${entry.previewKey}':\n      return import('@library/demos/${entry.namespace}/${entry.name}');`;
  }
  return `    case '${entry.previewKey}':\n      return import('${entry.importPath}');`;
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'));
  const rawComponents = catalog.components ?? [];
  const demoSources = await ensureDemoWrappers(rawComponents);
  const rawEntries = (
    await Promise.all(rawComponents.map((raw) => toCatalogEntry(raw, demoSources)))
  ).filter((entry) => entry !== null);
  const prunedCount = rawComponents.length - rawEntries.length;

  /** @type {Map<string, typeof rawEntries[0]>} */
  const deduped = new Map();
  for (const entry of rawEntries) {
    if (!deduped.has(entry.previewKey)) {
      deduped.set(entry.previewKey, entry);
    }
  }
  const entries = [...deduped.values()];

  const catalogTs = `/** Generated by scripts/buildComponentLibraryIndex.mjs — do not edit. */
export const COMPONENT_CATALOG_COUNT = ${entries.length};

export type CatalogKind = 'component' | 'example';
export type RenderMode = 'example' | 'demo' | 'auto';
export type DemoSource = 'manual' | 'upstream' | 'generated';
/** Why a non-previewable entry can't render live in the isolated gallery. */
export type UnavailableReason = 'env' | 'native' | 'deps' | 'nodemo';

export interface CatalogEntry {
  source: string;
  namespace: string;
  name: string;
  previewKey: string;
  importPath: string;
  category: string;
  kind: CatalogKind;
  renderMode: RenderMode;
  previewable: boolean;
  buildSafe: boolean;
  requiresEnv?: boolean;
  unavailableReason?: UnavailableReason;
  demoSource?: DemoSource;
  relatedExamples: string[];
  tags: string[];
  portable?: boolean;
}

export const CATALOG_ENTRIES: CatalogEntry[] = ${JSON.stringify(entries, null, 2)} as CatalogEntry[];

export const CATALOG_BY_KEY: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG_ENTRIES.map((e) => [e.previewKey, e]),
);

export const CATALOG_NAMESPACES = [...new Set(CATALOG_ENTRIES.map((e) => e.namespace))].sort();

export const CATALOG_COMPONENTS = CATALOG_ENTRIES.filter((e) => e.kind === 'component');
export const CATALOG_EXAMPLES = CATALOG_ENTRIES.filter((e) => e.kind === 'example');
`;

  const serverCases = entries
    .filter((e) => e.previewable)
    .map(serverLoadCase)
    .filter(Boolean);
  const loaderSwitchBody = `${serverCases.join('\n')}
    default:
      throw new Error(\`No preview loader for \${entry.previewKey}\`);`;

  const clientLoadTs = `/** Generated by scripts/buildComponentLibraryIndex.mjs — do not edit. */
'use client';
// @ts-nocheck
import type { CatalogEntry } from '@library/data/catalog';

export async function loadPreviewModule(entry: CatalogEntry): Promise<Record<string, unknown>> {
  switch (entry.previewKey) {
${loaderSwitchBody}
  }
}
`;

  await mkdir(dirname(OUT_CATALOG), { recursive: true });
  await writeFile(OUT_CATALOG, catalogTs, 'utf8');
  await writeFile(OUT_CLIENT_LOAD, clientLoadTs, 'utf8');
  console.log(
    `Wrote ${OUT_CATALOG} and ${OUT_CLIENT_LOAD} (${entries.length} entries, ${serverCases.length} preview loaders, ${prunedCount} phantom entries pruned)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
