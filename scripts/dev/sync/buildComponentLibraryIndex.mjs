#!/usr/bin/env node

/**
 * Generate component library catalog + preview loaders for apps/componentLibrary
 */

import { existsSync, readFileSync } from 'node:fs';
import { access, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';
import {
  categoryLabel,
  categoryOrder,
  inferCategory,
  TAXONOMY_SLUGS,
} from '../../lib/uiCategoryTaxonomy.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const CATALOG_PATH = join(REPO_ROOT, 'templates/web/.vybekiit/agent/ui-catalog-index.json');
const OUT_CATALOG = join(REPO_ROOT, 'apps/componentLibrary/src/data/catalog.ts');
const OUT_CATALOG_META = join(REPO_ROOT, 'apps/componentLibrary/src/data/catalog.meta.ts');
const OUT_CATALOG_JSON = join(REPO_ROOT, 'apps/componentLibrary/public/catalog.json');
const OUT_CATALOG_INDEX = join(REPO_ROOT, 'apps/componentLibrary/public/catalog/index.json');
const OUT_CATALOG_SHARDS = join(REPO_ROOT, 'apps/componentLibrary/public/catalog/shards');
const OUT_CLIENT_LOAD = join(REPO_ROOT, 'apps/componentLibrary/src/lib/loadPreview.client.ts');
const WEB_ROOT = join(REPO_ROOT, 'templates/web');
const DEMOS_ROOT = join(REPO_ROOT, 'apps/componentLibrary/src/demos');
const LIB_PKG_PATH = join(REPO_ROOT, 'apps/componentLibrary/package.json');
const MARK_DIR = join(WEB_ROOT, 'src/components/builder-assistant-mark');

/** Sync pose demo slugs from source — core + extended batches. */
function loadVybeKiitOctopusPoseIds() {
  const coreSrc = readFileSync(join(MARK_DIR, 'claudeOctopusPoses.ts'), 'utf8');
  const extSrc = readFileSync(join(MARK_DIR, 'claudeOctopusExtendedPoses.ts'), 'utf8');
  const batch2Src = readFileSync(join(MARK_DIR, 'claudeOctopusExtendedPosesBatch2.ts'), 'utf8');
  const coreBlock = coreSrc.match(/const CORE_POSES[\s\S]*?\] as const;/)?.[0] ?? '';
  const coreIds = [...coreBlock.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((match) => match[1]);
  const extIds = [...(extSrc + batch2Src).matchAll(/\{\s*id:\s*'([^']+)'/g)].map(
    (match) => match[1],
  );
  return [...coreIds, ...extIds];
}

const VYBEKIIT_OCTOPUS_POSES = loadVybeKiitOctopusPoseIds();

/** Sync deluxe scene slugs from the scene registry source. */
function loadVybeKiitOctopusSceneIds() {
  const src = readFileSync(join(MARK_DIR, 'claudeOctopusScenes.tsx'), 'utf8');
  const block = src.match(/const SCENES[\s\S]*?\n\];/)?.[0] ?? '';
  return [...block.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
}

const VYBEKIIT_OCTOPUS_SCENES = loadVybeKiitOctopusSceneIds();

const MANUAL_DEMOS = new Set([
  'vybekiit/claude-octopus-showcase',
  'vybekiit/claude-octopus-macos-desk',
  ...VYBEKIIT_OCTOPUS_POSES.map((pose) => `vybekiit/claude-octopus-${pose}`),
  ...VYBEKIIT_OCTOPUS_SCENES.map((scene) => `vybekiit/claude-octopus-scene-${scene}`),
  'vybekiit/builder-assistant-cursor',
  'vybekiit/builder-assistant-codex',
  'vybekiit/walkthrough',
  'aceternity/google-gemini-effect',
  'aceternity/layout-grid',
  'aceternity/animated-testimonials',
  'kibo/glimpse',
  'blocks-21st/be-ui-button',
  'blocks-21st/be-ui-theme-toggle',
  'blocks-21st/be-ui-animated-badge',
  'blocks-21st/be-ui-tilt-card',
  'blocks-21st/be-ui-404-not-found',
  'blocks-21st/smart-hover-auth-layout',
  'blocks-21st/siri-wave',
  'blocks-21st/gradient-shimmer',
  'blocks-21st/scroll-fade-list',
  'blocks-21st/animated-banner',
  'blocks-21st/game-of-life-loader',
  'blocks-21st/iridescent-foil',
  'blocks-21st/modern-login-signup',
  'blocks-21st/apple-color-picker',
  'blocks-21st/contributors-section',
  'blocks-21st/cascade-text',
  'blocks-21st/card-fan-carousel',
  'blocks-21st/iphone-mockup',
  'ai-elements/context',
]);

/** Registries on disk but excluded from live preview until optional deps are installed. */
const PREVIEW_DEFERRED_NAMESPACES = new Set([
  'coss',
  'cult',
  'tailark',
  'prompt-kit',
  'supabase',
  'blocks-so',
  'evilcharts',
]);

/** Kokonut brand SVG icons indexed as first-class catalog entries. */
const KOKONUT_LOGO_ICONS = [
  'anthropic',
  'anthropic-dark',
  'gemini',
  'open-ai',
  'open-ai-dark',
  'deepseek',
  'mistral',
];

/** VybeKiit-owned builder assistant marks — first-party gallery entries. */
const VYBEKIIT_MASCOT_ENTRIES = [
  {
    namespace: 'vybekiit',
    source: 'vybekiit',
    name: 'claude-octopus-showcase',
    kind: 'component',
    paths: ['src/components/builder-assistant-mark/BuilderAssistantMarkShowcase.tsx'],
    tags: ['mascot', 'showcase', 'claude-code', 'octopus'],
    category: 'brand-mascots',
  },
  {
    namespace: 'vybekiit',
    source: 'vybekiit',
    name: 'claude-octopus-macos-desk',
    kind: 'component',
    paths: ['src/components/builder-assistant-mark/ClaudeOctopusMacosDesk.tsx'],
    tags: ['mascot', 'claude-code', 'octopus', 'macos', 'terminal', 'scene'],
    category: 'brand-mascots',
  },
  ...VYBEKIIT_OCTOPUS_POSES.map((pose) => ({
    namespace: 'vybekiit',
    source: 'vybekiit',
    name: `claude-octopus-${pose}`,
    kind: 'component',
    paths: ['src/components/builder-assistant-mark/BuilderAssistantMark.tsx'],
    tags: ['mascot', 'claude-code', 'octopus', `pose-${pose}`],
    category: 'brand-mascots',
  })),
  ...VYBEKIIT_OCTOPUS_SCENES.map((scene) => ({
    namespace: 'vybekiit',
    source: 'vybekiit',
    name: `claude-octopus-scene-${scene}`,
    kind: 'component',
    paths: ['src/components/builder-assistant-mark/ClaudeOctopusScene.tsx'],
    tags: ['mascot', 'claude-code', 'octopus', 'scene', `scene-${scene}`],
    category: 'brand-mascots',
  })),
  {
    namespace: 'vybekiit',
    source: 'vybekiit',
    name: 'builder-assistant-cursor',
    kind: 'component',
    paths: ['src/components/builder-assistant-mark/BuilderAssistantMark.tsx'],
    tags: ['mascot', 'cursor', 'assistant-mark'],
    category: 'brand-mascots',
  },
  {
    namespace: 'vybekiit',
    source: 'vybekiit',
    name: 'builder-assistant-codex',
    kind: 'component',
    paths: ['src/components/builder-assistant-mark/BuilderAssistantMark.tsx'],
    tags: ['mascot', 'codex', 'assistant-mark'],
    category: 'brand-mascots',
  },
];

/** VybeKiit-owned first-party tools — showcased as previewable gallery entries. */
const VYBEKIIT_TOOL_ENTRIES = [
  {
    namespace: 'vybekiit',
    source: 'vybekiit',
    name: 'walkthrough',
    kind: 'component',
    paths: ['src/components/walkthrough/walkthrough.tsx'],
    tags: ['tutorial', 'walkthrough', 'coach-marks', 'onboarding', 'spotlight', 'dialog'],
    category: 'application',
  },
];

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

/** Map Kibo monorepo imports to web-template aliases (matches next.config). */
function remapRepoAlias(alias) {
  return alias
    .replace('@repo/shadcn-ui/lib/utils', '@vybekiit/ui/utils')
    .replace('@repo/shadcn-ui/components/ui/', '@vybekiit/ui/');
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
 * runtimes and deps that aren't installed. A missing `@vybekiit/ui/*` primitive
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
  /from ['"]lowlight['"]/,
  /lowlight\/lib/,
];

/**
 * @param {string} importPath
 */
function importPathToFile(importPath) {
  if (importPath.startsWith('@vybekiit/ui/')) {
    return join(REPO_ROOT, 'packages/ui/src', importPath.replace('@vybekiit/ui/', ''));
  }
  return join(WEB_ROOT, importPath.replace(/^@\//, 'src/'));
}

/**
 * @param {string} importPath
 */
async function resolveMirrorFilePath(importPath) {
  const base = importPathToFile(importPath);
  try {
    await access(`${base}.tsx`);
    return `${base}.tsx`;
  } catch {
    try {
      await access(join(base, 'index.tsx'));
      return join(base, 'index.tsx');
    } catch {
      return null;
    }
  }
}

/**
 * @param {string} importPath
 */
async function mirrorFileExists(importPath) {
  return (await resolveMirrorFilePath(importPath)) !== null;
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
  const generic =
    names.find((n) => n === `example-${componentName}`) ??
    names.find((n) => n === `${componentName}-demo`) ??
    names.find((n) => n === `${componentName}-default`) ??
    names.find((n) => n.startsWith(`${componentName}-demo`)) ??
    names.find((n) => n.startsWith(`${componentName}-example`));
  if (generic) {
    return generic;
  }
  if (namespace === 'magicui') {
    return names.find((n) => n.startsWith(`${componentName}-demo`)) ?? null;
  }
  if (namespace === 'ai-elements') {
    return names.find((n) => n === `example-${componentName}`) ?? null;
  }
  if (namespace === 'bundui') {
    return (
      names.find((n) => n === `${componentName}-default`) ??
      names.find((n) => n.startsWith(`${componentName}-`)) ??
      null
    );
  }
  if (namespace === 'aceternity' || namespace === 'kokonutui') {
    return (
      names.find((n) => n.startsWith(`example-${componentName}`)) ??
      names.find((n) => n.startsWith(`${componentName}-example`)) ??
      null
    );
  }
  return null;
}

/**
 * @param {string} content
 */
function extractNamedExports(content) {
  /** @type {Set<string>} */
  const names = new Set();
  for (const match of content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g)) {
    names.add(match[1]);
  }
  for (const match of content.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const token of match[1].split(',')) {
      const cleaned = token.trim().replace(/^type\s+/, '');
      const exportName = cleaned
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (exportName) {
        names.add(exportName);
      }
    }
  }
  return [...names];
}

/**
 * @param {string} name slug
 * @param {string} mirrorContent
 * @returns {{ kind: 'default' | 'named' | 'named-multiple', exportName?: string, exportNames?: string[] } | null}
 */
function resolveExportStrategy(name, mirrorContent) {
  const pascal = toPascalCase(name);
  const namedExports = extractNamedExports(mirrorContent);
  if (namedExports.includes(pascal)) {
    return { kind: 'named', exportName: pascal };
  }
  const slugParts = name.split(/[-_/]/).filter(Boolean);
  for (const exportName of namedExports) {
    const lower = exportName.toLowerCase();
    if (slugParts.every((part) => lower.includes(part))) {
      return { kind: 'named', exportName };
    }
  }
  const pascalExports = namedExports.filter((exportName) => /^[A-Z]/.test(exportName));
  if (pascalExports.length === 1) {
    return { kind: 'named', exportName: pascalExports[0] };
  }
  if (pascalExports.length > 1) {
    return { kind: 'named-multiple', exportNames: pascalExports.slice(0, 4) };
  }
  if (/export\s+default/.test(mirrorContent)) {
    return { kind: 'default' };
  }
  return null;
}

/**
 * @param {string} mirrorContent
 */
function componentNeedsChildren(mirrorContent) {
  return (
    /children\s*:\s*React(?:\.ReactNode|Node)/.test(mirrorContent) ||
    /children\s*:\s*ReactNode/.test(mirrorContent) ||
    /children\s*:\s*React\.ReactNode/.test(mirrorContent)
  );
}

/** Skip auto-generated empty demos when the component needs data props. */
function componentHasRequiredDataProps(mirrorContent) {
  const patterns = [
    /\{\s*cards\s*[,}:]/,
    /\{\s*testimonials\s*[,}:]/,
    /\{\s*products\s*[,}:]/,
    /\{\s*items\s*[,}:]/,
    /\{\s*slides\s*[,}:]/,
    /cards\s*:\s*\w+\[\]/,
    /testimonials\s*:\s*\w+\[\]/,
    /products\s*:\s*\w+\[\]/,
    /items\s*:\s*\w+\[\]/,
    /slides\s*:\s*\w+\[\]/,
  ];
  return patterns.some((pattern) => pattern.test(mirrorContent));
}

/** Generated demos must never silently return null — this pattern is banned. */
function demoHasNullFallback(content) {
  return /return\s+null/.test(content) && /Object\.values\(Mirror\)/.test(content);
}

function demoHasInvalidExport(content) {
  return /export default function \w+[\s\n]*\./.test(content);
}

/**
 * @param {string} namespace
 * @param {string} name
 */
async function isSimpleComponent(namespace, name, importPath) {
  const mirrorFile =
    (await resolveMirrorFilePath(importPath ?? `@/components/${namespace}/${name}`)) ?? '';
  if (!mirrorFile) {
    return false;
  }
  let content;
  try {
    content = await readFile(mirrorFile, 'utf8');
  } catch {
    return false;
  }
  if (BROKEN_IMPORT_PATTERNS.some((pattern) => pattern.test(content))) {
    return false;
  }
  return isBuildSafeShallow(mirrorFile);
}

/**
 * @param {string} namespace
 * @param {string} name
 * @param {'upstream' | 'generated'} source
 * @param {string} [upstreamExampleName]
 * @returns {Promise<boolean>}
 */
async function writeDemoWrapper(namespace, name, source, upstreamExampleName, importPath) {
  const path = demoPath(namespace, name);
  await mkdir(dirname(path), { recursive: true });
  const componentImport = importPath ?? `@/components/${namespace}/${name}`;
  if (source === 'upstream' && upstreamExampleName) {
    const content = `'use client';

export { default } from '@/components/${namespace}/${upstreamExampleName}';
`;
    await writeFile(path, content, 'utf8');
    return true;
  }

  const mirrorFile = await resolveMirrorFilePath(componentImport);
  if (!mirrorFile) {
    return false;
  }
  let mirrorContent = '';
  try {
    mirrorContent = await readFile(mirrorFile, 'utf8');
  } catch {
    return false;
  }

  const strategy = resolveExportStrategy(name, mirrorContent);
  if (!strategy) {
    return false;
  }

  if (componentHasRequiredDataProps(mirrorContent)) {
    return false;
  }

  const previewName = `${toPascalCase(name)}Preview`;
  const needsChildren = componentNeedsChildren(mirrorContent);
  const childStub = needsChildren
    ? `\n        <span className="text-sm text-muted-foreground">Preview</span>\n      `
    : '';
  const openChild = needsChildren ? '\n      ' : '';
  const closeChild = needsChildren ? '\n    ' : '';

  const content =
    strategy.kind === 'default'
      ? `'use client';

import Component from '${componentImport}';

export default function ${previewName}() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">${openChild}<Component${needsChildren ? '>' : ' />'}${childStub}${needsChildren ? '</Component>' : ''}${closeChild}</div>
  );
}
`
      : strategy.kind === 'named-multiple'
        ? `'use client';

import { ${strategy.exportNames?.join(', ')} } from '${componentImport}';

export default function ${previewName}() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      ${strategy.exportNames?.map((exportName) => `<${exportName} />`).join('\n      ')}
    </div>
  );
}
`
        : `'use client';

import { ${strategy.exportName} } from '${componentImport}';

export default function ${previewName}() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">${openChild}<${strategy.exportName}${needsChildren ? '>' : ' />'}${childStub}${needsChildren ? `</${strategy.exportName}>` : ''}${closeChild}</div>
  );
}
`;

  await writeFile(path, content, 'utf8');
  return true;
}

/**
 * Lighter safety gate for mirror files that are already full demos — skips deep
 * named-import validation that false-negatives on valid shadcn compound imports.
 * @param {string} filePath
 */
async function isDemoReExportSafe(filePath) {
  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch {
    return false;
  }
  if (BROKEN_IMPORT_PATTERNS.some((pattern) => pattern.test(content))) {
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
  const aliasImports = [...content.matchAll(/from ['"](@\/[^'"]+|@vybekiit\/[^'"]+)['"]/g)].map((match) => match[1]);
  for (const alias of aliasImports) {
    const normalized = alias
      .replace(/^@\/registry\/default\/ui\//, '@vybekiit/ui/')
      .replace(/^@\/registry\/new-york\/ui\//, '@vybekiit/ui/');
    if (!(await resolveAliasImport(normalized))) {
      return false;
    }
  }
  const relativeImports = [...content.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)].map(
    (match) => match[1],
  );
  for (const rel of relativeImports) {
    if (!(await resolveRelativeImport(filePath, rel))) {
      return false;
    }
  }
  return true;
}

/**
 * Mirror files that are already full demos (default export) — re-export as-is.
 * @param {string} namespace
 * @param {string} name
 * @param {string} importPath
 */
async function trySelfReExportDemo(namespace, name, importPath) {
  const mirrorFile = await resolveMirrorFilePath(importPath);
  if (!(mirrorFile && (await isDemoReExportSafe(mirrorFile)))) {
    return false;
  }
  const content = await readFile(mirrorFile, 'utf8');
  if (!/export\s+default/.test(content)) {
    return false;
  }
  const path = demoPath(namespace, name);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    `'use client';

export { default } from '${importPath}';
`,
    'utf8',
  );
  return true;
}

/**
 * @param {string} name
 */
function toPascalCase(name) {
  const result = name
    .split(/[-_/.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return /^[0-9]/.test(result) ? `Demo${result}` : result;
}

/**
 * VybeKiit mascot catalog entries are manual in MANUAL_DEMOS — this writes the thin
 * per-pose wrapper files that re-use `_mascotPoseDemo.tsx`.
 * @param {string} name
 * @param {string} demoFile
 * @returns {Promise<boolean>}
 */
async function ensureVybeKiitMascotDemo(name, demoFile) {
  if (name === 'walkthrough') {
    try {
      await access(demoFile);
      return true;
    } catch {
      return false;
    }
  }

  if (name === 'claude-octopus-macos-desk') {
    try {
      await access(demoFile);
      return true;
    } catch {
      return false;
    }
  }

  await mkdir(dirname(demoFile), { recursive: true });

  if (name === 'claude-octopus-showcase') {
    await writeFile(
      demoFile,
      `'use client';

export { BuilderAssistantMarkShowcase } from '@/components/builder-assistant-mark/BuilderAssistantMarkShowcase';
`,
      'utf8',
    );
    return true;
  }

  if (name === 'builder-assistant-cursor' || name === 'builder-assistant-codex') {
    const assistant = name === 'builder-assistant-cursor' ? 'cursor' : 'codex';
    const previewName = `${toPascalCase(name)}Preview`;
    await writeFile(
      demoFile,
      `'use client';

import { BuilderAssistantMark } from '@/components/builder-assistant-mark';

/**
 * Renders the ${assistant} assistant mark preview.
 *
 * @returns The rendered assistant mark preview.
 * @example
 * <${previewName} />
 */
export const ${previewName} = () => (
  <div className="flex min-h-[280px] items-center justify-center bg-muted/20 p-10">
    <BuilderAssistantMark assistant="${assistant}" size="xxl" />
  </div>
);
`,
      'utf8',
    );
    return true;
  }

  if (!name.startsWith('claude-octopus-')) {
    return false;
  }

  const pose = name.slice('claude-octopus-'.length);
  if (!pose || pose === 'showcase' || pose === 'macos-desk') {
    return false;
  }

  // Pose cards render via loadPreview.demo.vybekiit.tsx — no per-pose demo file needed.
  return true;
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

    const paths = raw.paths ?? [];
    const primaryPath = Array.isArray(paths) && paths.length > 0 ? String(paths[0]) : '';
    const importPath = primaryPath
      ? `@/${primaryPath.replace(/^src\//, '').replace(/\.tsx$/, '')}`
      : `@/components/${namespace}/${name}`;

    const key = previewKey(namespace, name);
    const demoFile = demoPath(namespace, name);

    if (MANUAL_DEMOS.has(key)) {
      if (namespace === 'vybekiit') {
        await ensureVybeKiitMascotDemo(name, demoFile);
      }
      demoSources.set(key, 'manual');
      continue;
    }

    if (await demoExists(namespace, name)) {
      const content = await readFile(demoFile, 'utf8');
      if (demoHasNullFallback(content) || demoHasInvalidExport(content)) {
        await unlink(demoFile).catch(() => {});
      } else if (content.includes("export { default } from '@/")) {
        const match = content.match(/from '(@\/[^']+)'/);
        const importTarget = match?.[1] ?? null;
        const exampleFile = importTarget ? await resolveMirrorFilePath(importTarget) : null;
        const valid =
          exampleFile &&
          ((await isDemoReExportSafe(exampleFile)) ||
            (await isBuildSafeExample(exampleFile).catch(() => false)));
        if (valid) {
          demoSources.set(key, 'upstream');
          continue;
        }
        await unlink(demoFile).catch(() => {});
      } else {
        const valid = await isBuildSafeShallow(demoFile).catch(() => false);
        if (valid && !demoHasNullFallback(content)) {
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

    if (await trySelfReExportDemo(namespace, name, importPath)) {
      demoSources.set(key, 'upstream');
      continue;
    }

    if (await isSimpleComponent(namespace, name, importPath)) {
      const mirrorFile = await resolveMirrorFilePath(importPath);
      if (!mirrorFile) {
        continue;
      }
      let mirrorContent = '';
      try {
        mirrorContent = await readFile(mirrorFile, 'utf8');
      } catch {
        continue;
      }
      if (componentHasRequiredDataProps(mirrorContent)) {
        continue;
      }
      if (!resolveExportStrategy(name, mirrorContent)) {
        continue;
      }
      const wrote = await writeDemoWrapper(namespace, name, 'generated', undefined, importPath);
      if (wrote) {
        demoSources.set(key, 'generated');
      }
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
 * @param {string} importPath e.g. @/components/foo/bar or @vybekiit/ui/button
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

    if (!specifier.startsWith('@/') && !specifier.startsWith('@vybekiit/')) {
      continue;
    }

    const normalized = specifier
      .replace(/^@\/registry\/default\/ui\//, '@vybekiit/ui/')
      .replace(/^@\/registry\/new-york\/ui\//, '@vybekiit/ui/');
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

  const aliasImports = [...content.matchAll(/from ['"](@\/[^'"]+|@repo\/[^'"]+|@vybekiit\/[^'"]+)['"]/g)].map(
    (m) => m[1],
  );
  for (const alias of aliasImports) {
    if (alias.startsWith('@repo/')) {
      const remapped = remapRepoAlias(alias);
      if (remapped.startsWith('@/') || remapped.startsWith('@vybekiit/')) {
        const normalized = remapped
          .replace(/^@\/registry\/default\/ui\//, '@vybekiit/ui/')
          .replace(/^@\/registry\/new-york\/ui\//, '@vybekiit/ui/');
        const resolved = await resolveAliasImport(normalized);
        if (!(resolved && (await isBuildSafeFile(resolved, visited)))) {
          return false;
        }
        continue;
      }
      return false;
    }

    if (alias.startsWith('@/') || alias.startsWith('@vybekiit/')) {
      const normalized = alias
        .replace(/^@\/registry\/default\/ui\//, '@vybekiit/ui/')
        .replace(/^@\/registry\/new-york\/ui\//, '@vybekiit/ui/');
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

  const aliasImports = [...content.matchAll(/from ['"](@\/[^'"]+|@repo\/[^'"]+|@vybekiit\/[^'"]+)['"]/g)].map(
    (m) => m[1],
  );
  for (const alias of aliasImports) {
    if (alias.startsWith('@repo/')) {
      const remapped = remapRepoAlias(alias);
      if (remapped.startsWith('@/') || remapped.startsWith('@vybekiit/')) {
        const normalized = remapped
          .replace(/^@\/registry\/default\/ui\//, '@vybekiit/ui/')
          .replace(/^@\/registry\/new-york\/ui\//, '@vybekiit/ui/');
        const resolved = await resolveAliasImport(normalized);
        if (!resolved) {
          return false;
        }
        continue;
      }
      return false;
    }
    if (alias.startsWith('@/') || alias.startsWith('@vybekiit/')) {
      const normalized = alias
        .replace(/^@\/registry\/default\/ui\//, '@vybekiit/ui/')
        .replace(/^@\/registry\/new-york\/ui\//, '@vybekiit/ui/');
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
 * @param {string} importPath
 * @param {Map<string, 'manual' | 'upstream' | 'generated'>} demoSources
 */
async function isDemoBuildSafe(namespace, name, demoFile, importPath, demoSources) {
  const source = demoSources.get(previewKey(namespace, name));
  if (source === 'upstream') {
    const content = await readFile(demoFile, 'utf8');
    const match = content.match(/from '(@\/[^']+)'/);
    if (match?.[1]) {
      const exampleFile = await resolveMirrorFilePath(match[1]);
      if (exampleFile && (await isDemoReExportSafe(exampleFile))) {
        return true;
      }
      if (exampleFile && (await isBuildSafeExample(exampleFile).catch(() => false))) {
        return true;
      }
    }
  }
  if (source === 'generated') {
    const mirrorFile = await resolveMirrorFilePath(importPath);
    return Boolean(
      mirrorFile && (await isBuildSafeShallow(demoFile)) && (await isBuildSafeShallow(mirrorFile)),
    );
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
  const hasDemo =
    kind === 'component'
      ? shouldUseVybeKiitDynamicDemo({ namespace, name }) || (await demoExists(namespace, name))
      : false;
  const renderMode = inferRenderMode({ name, kind }, hasDemo);
  const fileExists = await mirrorFileExists(importPath);
  // Prune phantom entries: listed in the registry catalog index but never synced into
  // the mirror (the untitled/kibo/gluestack dirs are empty). No source file = nothing
  // a buyer could scaffold and nothing to preview, so drop it rather than ship a
  // dead placeholder.
  if (!fileExists) {
    return null;
  }
  const mirrorFile = (await resolveMirrorFilePath(importPath)) ?? '';
  const demoFile = demoPath(namespace, name);
  const demoSourceKey = previewKey(namespace, name);
  const demoSourceKind = demoSources.get(demoSourceKey);
  const isVirtualVybeKiitPose = shouldUseVybeKiitDynamicDemo({ namespace, name });
  const demoBuildSafe = hasDemo
    ? isVirtualVybeKiitPose
      ? await isBuildSafeShallow(join(DEMOS_ROOT, 'vybekiit', '_mascotPoseDemo.tsx')).catch(
          () => false,
        )
      : demoSourceKind === 'manual'
        ? await isDemoBuildSafe(namespace, name, demoFile, importPath, demoSources).catch(
            () => false,
          )
        : await isBuildSafeFile(demoFile).catch(() => false)
    : false;

  const exampleBuildSafe =
    fileExists &&
    mirrorFile &&
    !API_KEY_EXAMPLES.has(name) &&
    (await isBuildSafeExample(mirrorFile).catch(() => false));

  const componentPreviewable =
    fileExists &&
    hasDemo &&
    demoBuildSafe &&
    !API_KEY_EXAMPLES.has(name) &&
    !PREVIEW_DEFERRED_NAMESPACES.has(namespace);

  const previewable =
    kind === 'example'
      ? exampleBuildSafe && !PREVIEW_DEFERRED_NAMESPACES.has(namespace)
      : componentPreviewable;
  const buildSafe = previewable;
  const requiresEnv = API_KEY_EXAMPLES.has(name);
  const unavailableReason = previewable
    ? undefined
    : await classifyUnavailable(mirrorFile, requiresEnv);
  const demoSource = demoSources.get(previewKey(namespace, name));
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : [];
  const category = inferCategory(name, raw, tags, namespace, String(raw.category ?? ''));

  return {
    source: String(raw.source ?? namespace),
    namespace,
    name,
    previewKey: previewKey(namespace, name),
    importPath,
    category,
    kind,
    renderMode,
    previewable,
    buildSafe,
    requiresEnv,
    unavailableReason,
    demoSource: demoSource ?? undefined,
    relatedExamples: [],
    tags,
    portable: raw.portable === true,
  };
}

/**
 * Per-pose mascot demos share one webpack context import instead of ~190 switch cases.
 * @param {{ namespace: string, name: string }} entry
 */
function shouldUseVybeKiitDynamicDemo(entry) {
  return (
    entry.namespace === 'vybekiit' &&
    entry.name.startsWith('claude-octopus-') &&
    entry.name !== 'claude-octopus-showcase' &&
    entry.name !== 'claude-octopus-macos-desk'
  );
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
  // The raw catalog index is a gitignored artifact produced by `pnpm sync:ui`
  // (network registry sync). It is absent in a cold checkout (CI, fresh clone), so
  // fall back to the committed generated catalog rather than crashing the build.
  if (!existsSync(CATALOG_PATH)) {
    console.log(
      '[build-component-library-index] ui-catalog-index.json not found (sync:ui artifact) — using the committed catalog and skipping rebuild. Run `pnpm sync:ui` to refresh it.',
    );
    return;
  }
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'));
  const iconEntries = KOKONUT_LOGO_ICONS.map((name) => ({
    namespace: 'kokonutui',
    source: 'kokonutui',
    name,
    kind: 'component',
    paths: [`src/components/kokonutui/${name}.tsx`],
    tags: ['icon', 'logo', 'brand'],
    category: 'icons-logos',
  }));
  const rawComponents = [
    ...(catalog.components ?? []),
    ...iconEntries,
    ...VYBEKIIT_MASCOT_ENTRIES,
    ...VYBEKIIT_TOOL_ENTRIES,
  ];
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

  /** @type {Record<string, number>} */
  const categoryCounts = {};
  for (const entry of entries) {
    categoryCounts[entry.category] = (categoryCounts[entry.category] ?? 0) + 1;
  }
  const catalogCategories = TAXONOMY_SLUGS.filter((slug) => (categoryCounts[slug] ?? 0) > 0).map(
    (slug) => ({
      slug,
      label: categoryLabel(slug),
      count: categoryCounts[slug] ?? 0,
      order: categoryOrder(slug),
    }),
  );

  const nullFallbackPreviewable = [];
  for (const entry of entries) {
    if (!entry.previewable || entry.renderMode !== 'demo') {
      continue;
    }
    if (shouldUseVybeKiitDynamicDemo(entry)) {
      continue;
    }
    try {
      const demoContent = await readFile(demoPath(entry.namespace, entry.name), 'utf8');
      if (demoHasNullFallback(demoContent)) {
        nullFallbackPreviewable.push(entry.previewKey);
      }
    } catch {
      nullFallbackPreviewable.push(entry.previewKey);
    }
  }
  if (nullFallbackPreviewable.length > 0) {
    throw new Error(
      `${nullFallbackPreviewable.length} previewable demos still use banned return-null fallback: ${nullFallbackPreviewable.slice(0, 5).join(', ')}…`,
    );
  }

  // Drop stale demo files for entries no longer previewable.
  for (const entry of entries) {
    if (entry.previewable || entry.kind !== 'component') {
      continue;
    }
    if (MANUAL_DEMOS.has(entry.previewKey)) {
      continue;
    }
    const staleDemo = demoPath(entry.namespace, entry.name);
    await unlink(staleDemo).catch(() => {});
  }

  // Per-pose mascot shims are virtual — remove legacy one-file-per-pose wrappers.
  for (const pose of VYBEKIIT_OCTOPUS_POSES) {
    await unlink(demoPath('vybekiit', `claude-octopus-${pose}`)).catch(() => {});
  }

  const catalogTs = `/** Generated by scripts/dev/sync/buildComponentLibraryIndex.mjs — do not edit. */
export const COMPONENT_CATALOG_COUNT = ${entries.length};

export type CatalogKind = 'component' | 'example';
export type RenderMode = 'example' | 'demo' | 'auto';
export type DemoSource = 'manual' | 'upstream' | 'generated';
/** Why a non-previewable entry can't render live in the isolated gallery. */
export type UnavailableReason = 'env' | 'native' | 'deps' | 'nodemo';

export interface CatalogCategory {
  slug: string;
  label: string;
  count: number;
  order: number;
}

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

// Emitted via JSON.parse so tsc doesn't compute a giant union over every literal entry.
export const CATALOG_ENTRIES: CatalogEntry[] = JSON.parse(
  ${JSON.stringify(JSON.stringify(entries))},
) as CatalogEntry[];

export const CATALOG_BY_KEY: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG_ENTRIES.map((e) => [e.previewKey, e]),
);

export const CATALOG_NAMESPACES = [...new Set(CATALOG_ENTRIES.map((e) => e.namespace))].sort();

export const CATALOG_CATEGORIES: CatalogCategory[] = ${JSON.stringify(catalogCategories, null, 2)} as CatalogCategory[];

export const CATALOG_BY_CATEGORY: Record<string, CatalogEntry[]> = CATALOG_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.slug] = CATALOG_ENTRIES.filter((entry) => entry.category === category.slug);
    return acc;
  },
  {} as Record<string, CatalogEntry[]>,
);

export const CATALOG_COMPONENTS = CATALOG_ENTRIES.filter((e) => e.kind === 'component');
export const CATALOG_EXAMPLES = CATALOG_ENTRIES.filter((e) => e.kind === 'example');
`;

  const componentCount = entries.filter((e) => e.kind === 'component').length;
  const exampleCount = entries.filter((e) => e.kind === 'example').length;
  const namespaces = [...new Set(entries.map((e) => e.namespace))].sort();

  const catalogMetaTs = `/** Generated by scripts/dev/sync/buildComponentLibraryIndex.mjs — do not edit. */

export const COMPONENT_CATALOG_COUNT = ${entries.length};
export const CATALOG_COMPONENT_COUNT = ${componentCount};
export const CATALOG_EXAMPLE_COUNT = ${exampleCount};

export const CATALOG_CATEGORIES = ${JSON.stringify(catalogCategories, null, 2)} as import('./catalog').CatalogCategory[];

export const CATALOG_NAMESPACES: readonly string[] = ${JSON.stringify(namespaces)} as const;
`;

  const catalogJsonPayload = {
    entries,
    categories: catalogCategories,
    namespaces,
    componentCount,
    exampleCount,
    count: entries.length,
  };

  const catalogIndexPayload = {
    categories: catalogCategories,
    namespaces,
    componentCount,
    exampleCount,
    count: entries.length,
  };

  const serverCases = entries
    .filter((e) => e.previewable && !shouldUseVybeKiitDynamicDemo(e))
    .map(serverLoadCase)
    .filter(Boolean);
  const loaderSwitchBody = `${serverCases.join('\n')}
    default:
      throw new Error(\`No preview loader for \${entry.previewKey}\`);`;

  const clientLoadTs = `/** Generated by scripts/dev/sync/buildComponentLibraryIndex.mjs — do not edit. */
'use client';
// @ts-nocheck
import type { CatalogEntry } from '@library/data/catalog';

/**
 * Dynamically imports the preview module for a catalog entry.
 *
 * @param entry - Catalog entry to load.
 * @returns The imported preview module.
 * @example
 * const mod = await loadPreviewModule(entry);
 */
export const loadPreviewModule = async (
  entry: CatalogEntry,
): Promise<Record<string, unknown>> => {
  if (
    entry.namespace === 'vybekiit' &&
    entry.name.startsWith('claude-octopus-') &&
    entry.name !== 'claude-octopus-showcase' &&
    entry.name !== 'claude-octopus-macos-desk'
  ) {
    return import(\`@library/demos/vybekiit/\${entry.name}\`);
  }
  switch (entry.previewKey) {
${loaderSwitchBody}
  }
};
`;

  await mkdir(dirname(OUT_CATALOG), { recursive: true });
  await mkdir(dirname(OUT_CATALOG_JSON), { recursive: true });
  await mkdir(OUT_CATALOG_SHARDS, { recursive: true });
  await writeFile(OUT_CATALOG, catalogTs, 'utf8');
  await writeFile(OUT_CATALOG_META, catalogMetaTs, 'utf8');
  await writeFile(OUT_CATALOG_JSON, JSON.stringify(catalogJsonPayload), 'utf8');
  await writeFile(OUT_CATALOG_INDEX, JSON.stringify(catalogIndexPayload), 'utf8');
  for (const category of catalogCategories) {
    const shardEntries = entries.filter((entry) => entry.category === category.slug);
    await writeFile(
      join(OUT_CATALOG_SHARDS, `${category.slug}.json`),
      JSON.stringify({ entries: shardEntries }),
      'utf8',
    );
  }
  await writeFile(OUT_CLIENT_LOAD, clientLoadTs, 'utf8');
  console.log(
    `Wrote ${OUT_CATALOG}, ${OUT_CATALOG_META}, ${OUT_CATALOG_JSON}, ${OUT_CATALOG_INDEX}, ${catalogCategories.length} shards and ${OUT_CLIENT_LOAD} (${entries.length} entries, ${serverCases.length} preview loaders, ${prunedCount} phantom entries pruned)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
