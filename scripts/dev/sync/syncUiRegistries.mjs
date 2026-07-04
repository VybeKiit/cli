#!/usr/bin/env node
/**
 * Sync UI component mirrors from upstream registries into templates/web.
 *
 * Usage:
 *   node scripts/syncUiRegistries.mjs [--source bundui] [--dry-run] [--limit 10]
 *
 * Writes:
 *   - templates/web/src/components/{namespace}/
 *   - scripts/ui-registry-lock.json
 *   - templates/web/.vybekiit/agent/ui-catalog-index.json
 *   - templates/web/.vybekiit/agent/ui-catalog-index.mobile.json
 */

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';
import { inferCategory } from '../../lib/uiCategoryTaxonomy.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const MANIFEST_PATH = join(REPO_ROOT, 'scripts/data/ui-registry-manifest.json');
const LOCK_PATH = join(REPO_ROOT, 'scripts/data/ui-registry-lock.json');

/** Web-only deps that block mobile StyleSheet ports. */
const WEB_ONLY_DEPS = new Set([
  'framer-motion',
  'motion',
  '@tsparticles/react',
  '@tsparticles/engine',
  '@tsparticles/slim',
  'next-themes',
  'canvas-confetti',
  '@number-flow/react',
]);

const SHADCN_PRIMITIVE_URL = 'https://ui.shadcn.com/r/styles/new-york/{name}.json';
const WEB_PACKAGE_JSON = join(REPO_ROOT, 'templates/web/package.json');

/** Catalog sources used for exact-name dedup when syncing new libraries. */
const LEGACY_DEDUP_SOURCES = new Set([
  'bundui',
  'magicui',
  'kokonutui',
  'aceternity',
  'untitled',
  'gluestack',
  '21st',
]);

/** @typedef {{ type: string, namespace: string, tags?: string[], discover?: boolean, filter?: string, registryIndex?: string, itemUrlTemplate?: string, urls?: string[], requiresAuth?: boolean, repo?: string, branch?: string, paths?: string[], skipNames?: string[], items?: string[], itemsFile?: string }} SourceConfig */

/**
 * @param {string} url
 * @param {number} [attempt]
 * @returns {Promise<unknown>}
 */
async function fetchJson(url, attempt = 0) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (res.status === 429 && attempt < 4) {
    const retryAfter = Number(res.headers.get('retry-after') ?? 0);
    const delayMs = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 500;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const text = await res.text();
  if (text.trimStart().startsWith('<!')) {
    throw new Error(`Expected JSON, got HTML for ${url}`);
  }
  return JSON.parse(text);
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} filter
 */
function passesRegistryFilter(item, filter) {
  if (filter === 'free') {
    return item.meta?.isPro !== true;
  }
  if (filter === 'ui-only') {
    return item.type === 'registry:ui' || item.type === 'registry:component';
  }
  if (filter === 'magicui') {
    return item.type === 'registry:ui' || item.type === 'registry:example';
  }
  if (filter === 'aceternity') {
    return item.type === 'registry:ui' || item.type === 'registry:block';
  }
  if (filter === 'ai-elements') {
    const name = String(item.name ?? '');
    if (item.type === 'registry:component') {
      return true;
    }
    if (item.type === 'registry:block' && name.startsWith('example-')) {
      return true;
    }
    return false;
  }
  if (filter === 'coss') {
    return item.type === 'registry:ui' || item.type === 'registry:block';
  }
  return true;
}

/**
 * @param {SourceConfig} source
 * @param {Set<string>} skipNames
 * @returns {Promise<string[]>}
 */
async function resolveRegistryItemNames(source, skipNames) {
  if (source.discover) {
    return discoverRegistryItems(source, skipNames);
  }
  if (source.itemsFile) {
    const raw = JSON.parse(await readFile(join(REPO_ROOT, source.itemsFile), 'utf8'));
    if (!Array.isArray(raw)) {
      throw new Error(`itemsFile must be a JSON array: ${source.itemsFile}`);
    }
    return raw.filter((name) => typeof name === 'string' && !skipNames.has(name));
  }
  return (source.items ?? []).filter((name) => !skipNames.has(name));
}

/**
 * @param {SourceConfig} source
 * @param {Set<string>} skipNames
 * @returns {Promise<string[]>}
 */
async function discoverRegistryItems(source, skipNames) {
  /** @type {{ items?: Array<Record<string, unknown>> }} */
  const registry = await fetchJson(source.registryIndex);
  return (registry.items ?? [])
    .filter((item) => typeof item.name === 'string')
    .filter((item) => passesRegistryFilter(item, source.filter ?? 'all'))
    .map((item) => String(item.name))
    .filter((name) => !skipNames.has(name));
}

/**
 * @param {string} filePath
 * @param {string} [itemName]
 */
function shouldSkipMirrorFile(filePath, itemName) {
  const base = basename(filePath);
  if (/\.(story|demo)\.tsx$/.test(base)) {
    return true;
  }
  if (namespaceIsUntitledArtifact(filePath)) {
    return /\.(story|demo)\.tsx$/.test(base);
  }
  return false;
}

/** @param {string} filePath */
function namespaceIsUntitledArtifact(filePath) {
  return filePath.includes('untitled') || /\/(story|demo)\./.test(filePath);
}

/**
 * @param {string} templateRoot
 * @param {string} namespace
 * @param {{ path?: string, target?: string }} file
 * @param {string} itemName
 */
function normalizeRegistryTarget(target, namespace) {
  if (!target) {
    return null;
  }
  let rel = target.replace(/^components\//, '');
  if (namespace === 'ai-elements') {
    rel = rel.replace(/^ai-elements\//, '');
    rel = rel.replace(/\.tsx\.tsx$/, '.tsx');
  }
  if (namespace === 'kibo') {
    rel = rel.replace(/^kibo-ui\//, '');
  }
  return rel;
}

function resolveTargetPath(templateRoot, namespace, file, itemName) {
  const filePath = file.path ?? '';
  const fromTarget = normalizeRegistryTarget(file.target, namespace);
  const rel =
    fromTarget ??
    (filePath.includes('registry/magicui/')
      ? filePath.replace(/^registry\/magicui\//, '')
      : null) ??
    (filePath.startsWith('ui/') ? filePath.replace(/^ui\//, '') : null) ??
    (filePath.startsWith('components/kokonutui/')
      ? filePath.replace(/^components\/kokonutui\//, '')
      : null) ??
    (filePath.includes('registry/default/ai-elements/')
      ? filePath.replace(/^registry\/default\/ai-elements\//, '')
      : null) ??
    (filePath.includes('registry/default/ui/')
      ? filePath.replace(/^registry\/default\/ui\//, '')
      : null) ??
    (filePath.includes('registry/default/examples/') ? `examples/${basename(filePath)}` : null) ??
    (filePath.includes('registry/example/') ? `${itemName}.tsx` : null) ??
    (namespace === 'aceternity' && filePath.startsWith('components/')
      ? basename(filePath)
      : null) ??
    (filePath.includes('/hooks/') && namespace === 'kokonutui'
      ? `../hooks/mirror/kokonutui/${basename(filePath)}`
      : null) ??
    (filePath.includes('/icons/') && namespace === 'kokonutui'
      ? `icons/${basename(filePath)}`
      : null) ??
    (namespace === 'kibo' && filePath === 'index.tsx' ? `${itemName}/index.tsx` : null) ??
    `${itemName}.tsx`;

  if (rel.startsWith('../hooks/mirror/')) {
    return join(templateRoot, 'src', rel.replace(/^\.\.\//, ''));
  }

  const normalized = rel.replace(/^components\//, '');
  return join(templateRoot, 'src/components', namespace, normalized);
}

/**
 * @param {string} templateRoot
 * @param {string} namespace
 * @param {Record<string, unknown>} item
 * @param {boolean} dryRun
 */
/**
 * @param {string} content
 */
function normalizeMirroredContent(content) {
  return content
    .replace(/@\/registry\/magicui\//g, '@/components/magicui/')
    .replace(/@\/registry\/default\/ui\//g, '@/components/ui/')
    .replace(/@\/registry\/new-york\/ui\//g, '@/components/ui/');
}

async function writeShadcnRegistryItem(templateRoot, namespace, item, dryRun) {
  const files = item.files ?? [];
  const itemName = String(item.name ?? 'component');
  const written = [];
  for (const file of files) {
    if (!(file.content && file.path)) {
      continue;
    }
    if (shouldSkipMirrorFile(file.path, itemName)) {
      continue;
    }
    const target = resolveTargetPath(templateRoot, namespace, file, itemName);
    const content = normalizeMirroredContent(String(file.content));
    if (!dryRun) {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, 'utf8');
    }
    written.push(relative(templateRoot, target));
  }
  return written;
}

/**
 * @param {string} dep
 */
function isShadcnPrimitiveName(dep) {
  return /^[a-z][a-z0-9-]*$/.test(dep);
}

/**
 * @param {string} templateRoot
 * @param {string} primitiveName
 * @param {boolean} dryRun
 * @param {Set<string>} installed
 */
async function installShadcnPrimitive(templateRoot, primitiveName, dryRun, installed) {
  if (!isShadcnPrimitiveName(primitiveName) || installed.has(primitiveName)) {
    return;
  }
  const uiDir = join(templateRoot, 'src/components/ui');
  const candidates = [
    join(uiDir, `${primitiveName}.tsx`),
    join(uiDir, `${primitiveName}/index.tsx`),
  ];
  for (const candidate of candidates) {
    try {
      const st = await stat(candidate);
      if (st.isFile()) {
        installed.add(primitiveName);
        return;
      }
    } catch {
      // not installed yet
    }
  }

  installed.add(primitiveName);
  const url = SHADCN_PRIMITIVE_URL.replace('{name}', primitiveName);
  try {
    /** @type {Record<string, unknown>} */
    const item = await fetchJson(url);
    const files = item.files ?? [];
    for (const file of files) {
      if (!file.content) {
        continue;
      }
      const fromTarget = file.target?.replace(/^components\/ui\//, '');
      const rel =
        (fromTarget && fromTarget.length > 0 ? fromTarget : null) ??
        file.path?.replace(/^ui\//, '') ??
        file.path?.replace(/^registry\/new-york\/ui\//, '') ??
        `${primitiveName}.tsx`;
      if (!(rel && rel.endsWith('.tsx'))) {
        continue;
      }
      const target = join(uiDir, basename(rel));
      if (!dryRun) {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, file.content, 'utf8');
      }
    }
    await ensureRegistryDependencies(
      templateRoot,
      item.registryDependencies ?? [],
      dryRun,
      installed,
    );
  } catch (error) {
    console.warn(`[ui] skip primitive ${primitiveName}: ${error.message}`);
  }
}

/**
 * @param {string} templateRoot
 * @param {string[]} registryDeps
 * @param {boolean} dryRun
 * @param {Set<string>} installed
 */
async function ensureRegistryDependencies(templateRoot, registryDeps, dryRun, installed) {
  for (const dep of registryDeps ?? []) {
    const name = String(dep);
    if (!isShadcnPrimitiveName(name)) {
      continue;
    }
    await installShadcnPrimitive(templateRoot, name, dryRun, installed);
  }
}

/**
 * @param {string} name
 * @param {string} namespace
 * @param {Record<string, unknown>} item
 * @param {Set<string>} catalogNames
 */
function inferKind(name, namespace, item, catalogNames) {
  if (name.startsWith('example-')) {
    return 'example';
  }
  if (namespace === 'magicui' && (item.type === 'registry:example' || /-demo(-\d+)?$/.test(name))) {
    return 'example';
  }
  if (namespace === 'aceternity' && item.type === 'registry:block') {
    return 'example';
  }
  if (namespace === 'bundui') {
    const dash = name.indexOf('-');
    if (dash > 0) {
      const base = name.slice(0, dash);
      if (catalogNames.has(base)) {
        return 'example';
      }
    }
  }
  return 'component';
}

/**
 * @param {string} depSpec
 */
function parsePackageName(depSpec) {
  if (!depSpec || typeof depSpec !== 'string') {
    return null;
  }
  if (depSpec.startsWith('@')) {
    const versionAt = depSpec.lastIndexOf('@');
    if (versionAt > 0) {
      return depSpec.slice(0, versionAt);
    }
    return depSpec;
  }
  const versionAt = depSpec.indexOf('@');
  return versionAt > 0 ? depSpec.slice(0, versionAt) : depSpec;
}

/**
 * @param {Array<Record<string, unknown>>} catalog
 * @param {boolean} dryRun
 */
async function collectNpmDependencies(catalog, dryRun) {
  /** @type {Set<string>} */
  const deps = new Set();
  for (const entry of catalog) {
    for (const dep of entry.dependencies ?? []) {
      if (typeof dep === 'string' && !dep.startsWith('@/')) {
        deps.add(parsePackageName(dep));
      }
    }
  }
  if (deps.size === 0 || dryRun) {
    return;
  }

  const pkg = JSON.parse(await readFile(WEB_PACKAGE_JSON, 'utf8'));
  pkg.dependencies ??= {};
  let changed = false;
  for (const dep of deps) {
    if (!(dep && /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i.test(dep))) {
      continue;
    }
    if (!pkg.dependencies[dep]) {
      pkg.dependencies[dep] = 'latest';
      changed = true;
    }
  }
  if (changed) {
    const sorted = Object.keys(pkg.dependencies).sort();
    const nextDeps = {};
    for (const key of sorted) {
      nextDeps[key] = pkg.dependencies[key];
    }
    pkg.dependencies = nextDeps;
    await writeFile(WEB_PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
    console.log(`\nMerged ${deps.size} mirrored npm dependencies into templates/web/package.json`);
  }
}

/**
 * @param {string} templateRoot
 * @param {string} sourceId
 * @param {SourceConfig} source
 * @param {{ dryRun: boolean, limit?: number }} opts
 */
async function syncShadcnRegistrySource(templateRoot, sourceId, source, opts, skipNames) {
  const names = await resolveRegistryItemNames(source, skipNames);
  if (names.length === 0 && source.itemsFile) {
    console.warn(
      `[${sourceId}] no items — run node scripts/dev/sync/buildShadcnblocksFreeItems.mjs when not rate-limited`,
    );
  }
  const slice = opts.limit ? names.slice(0, opts.limit) : names;
  /** @type {Set<string>} */
  const catalogNames = new Set(slice);
  const results = [];
  /** @type {Set<string>} */
  const installedPrimitives = new Set();

  for (const name of slice) {
    const url = source.itemUrlTemplate.replace('{name}', name);
    try {
      const item = await fetchJson(url);
      await ensureRegistryDependencies(
        templateRoot,
        item.registryDependencies ?? [],
        opts.dryRun,
        installedPrimitives,
      );
      const paths = await writeShadcnRegistryItem(
        templateRoot,
        source.namespace,
        item,
        opts.dryRun,
      );
      if (paths.length > 0) {
        results.push({
          source: sourceId,
          namespace: source.namespace,
          name,
          paths,
          dependencies: item.dependencies ?? [],
          tags: inferTags(name, item, source.tags ?? []),
          portable: isPortable(item.dependencies ?? []),
          category: classifyCategory(
            name,
            item,
            inferTags(name, item, source.tags ?? []),
            source.namespace,
          ),
          kind: inferKind(name, source.namespace, item, catalogNames),
        });
      }
    } catch (error) {
      console.warn(`[${sourceId}] skip ${name}: ${error.message}`);
    }
  }
  return results;
}

/**
 * @param {string} templateRoot
 * @param {string} sourceId
 * @param {SourceConfig} source
 * @param {{ dryRun: boolean }} opts
 */
async function syncShadcnUrlSource(templateRoot, sourceId, source, opts) {
  if (source.requiresAuth && (source.urls?.length ?? 0) === 0) {
    console.warn(
      `[${sourceId}] skipped — 21st.dev registry URLs require auth; add curated urls to manifest when available`,
    );
    return [];
  }
  const results = [];
  for (const url of source.urls ?? []) {
    try {
      const item = await fetchJson(url);
      const paths = await writeShadcnRegistryItem(
        templateRoot,
        source.namespace,
        item,
        opts.dryRun,
      );
      results.push({
        source: sourceId,
        name: String(item.name ?? basename(url, '.json')),
        paths,
        dependencies: item.dependencies ?? [],
        tags: source.tags ?? [],
        portable: isPortable(item.dependencies ?? []),
        category: classifyCategory(
          String(item.name ?? ''),
          item,
          source.tags ?? [],
          source.namespace,
        ),
      });
    } catch (error) {
      console.warn(`[${sourceId}] skip ${url}: ${error.message}`);
    }
  }
  return results;
}

/**
 * @param {string} repo
 * @param {string} branch
 * @param {string} path
 */
async function fetchGithubTree(repo, branch, path) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} for ${path}`);
  }
  return res.json();
}

/**
 * @param {string} repo
 * @param {string} branch
 * @param {string} filePath
 */
async function fetchGithubRaw(repo, branch, filePath) {
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Raw ${res.status} for ${filePath}`);
  }
  return res.text();
}

/**
 * @param {string} templateRoot
 * @param {string} sourceId
 * @param {SourceConfig} source
 * @param {{ dryRun: boolean }} opts
 */
async function syncGithubTreeSource(templateRoot, sourceId, source, opts) {
  const results = [];
  for (const treePath of source.paths ?? []) {
    try {
      const entries = await fetchGithubTree(source.repo, source.branch, treePath);
      const files = Array.isArray(entries)
        ? entries.filter(
            (e) =>
              e.type === 'file' &&
              extname(e.name) === '.tsx' &&
              !/\.(story|demo)\.tsx$/.test(e.name),
          )
        : [];
      for (const file of files) {
        const content = await fetchGithubRaw(source.repo, source.branch, file.path);
        const relPath = file.path.split('/').slice(-2).join('/');
        const target = join(templateRoot, 'src/components', source.namespace, relPath);
        if (!opts.dryRun) {
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, content, 'utf8');
        }
        results.push({
          source: sourceId,
          name: basename(file.path, extname(file.path)),
          paths: [relative(templateRoot, target)],
          dependencies: [],
          tags: source.tags ?? [],
          portable: false,
          category: treePath.split('/')[1] ?? 'component',
        });
      }
    } catch (error) {
      console.warn(`[${sourceId}] skip ${treePath}: ${error.message}`);
    }
  }
  return results;
}

/**
 * @param {string[]} dependencies
 */
function isPortable(dependencies) {
  return !dependencies.some((dep) => WEB_ONLY_DEPS.has(dep));
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} item
 * @param {string[]} baseTags
 */
function inferTags(name, item, baseTags) {
  const tags = new Set(baseTags);
  const haystack = `${name} ${item.title ?? ''} ${item.description ?? ''}`.toLowerCase();
  for (const tag of [
    'hero',
    'pricing',
    'testimonial',
    'faq',
    'bento',
    'card',
    'button',
    'form',
    'chart',
    'background',
    'navbar',
    'footer',
    'animated',
  ]) {
    if (haystack.includes(tag)) {
      tags.add(tag);
    }
  }
  return [...tags];
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} item
 * @param {string[]} [tags]
 * @param {string} [namespace]
 */
function classifyCategory(name, item, tags = [], namespace = '') {
  return inferCategory(name, item, tags, namespace, String(item.category ?? ''));
}

/**
 * @param {string} filePath
 */
async function sha256File(filePath) {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * @param {string} dir
 * @param {string} root
 * @returns {Promise<Array<{ path: string, sha256: string }>>}
 */
async function walkDir(dir, root) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full, root)));
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      files.push({
        path: relative(root, full),
        sha256: await sha256File(full),
      });
    }
  }
  return files;
}

/**
 * @param {string} templateRoot
 * @param {Array<Record<string, unknown>>} catalog
 * @param {boolean} dryRun
 */
async function writeCatalogIndexes(templateRoot, catalog, dryRun) {
  const agentDir = join(templateRoot, '.vybekiit/agent');
  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    componentCount: catalog.length,
    sources: groupBySource(catalog),
    components: catalog,
  };
  const mobileIndex = {
    ...index,
    components: catalog.map((c) => ({
      ...c,
      portable: c.portable === true,
    })),
  };

  if (!dryRun) {
    await mkdir(agentDir, { recursive: true });
    await writeFile(
      join(agentDir, 'ui-catalog-index.json'),
      `${JSON.stringify(index, null, 2)}\n`,
      'utf8',
    );
    await writeFile(
      join(agentDir, 'ui-catalog-index.mobile.json'),
      `${JSON.stringify(mobileIndex, null, 2)}\n`,
      'utf8',
    );
    const mobileAgentDir = join(REPO_ROOT, 'templates/mobile/.vybekiit/agent');
    await mkdir(mobileAgentDir, { recursive: true });
    await writeFile(
      join(mobileAgentDir, 'ui-catalog-index.mobile.json'),
      `${JSON.stringify(mobileIndex, null, 2)}\n`,
      'utf8',
    );
  }
}

/**
 * @param {Array<Record<string, unknown>>} catalog
 */
function groupBySource(catalog) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const entry of catalog) {
    const source = String(entry.source);
    counts[source] = (counts[source] ?? 0) + 1;
  }
  return counts;
}

/**
 * @param {string} templateRoot
 * @param {Array<Record<string, unknown>>} catalog
 * @param {boolean} dryRun
 */
async function writeLockFile(templateRoot, catalog, dryRun) {
  const namespaces = [
    'bundui',
    'magicui',
    'kokonutui',
    'aceternity',
    'untitled',
    'gluestack',
    'blocks/21st',
    'ai-elements',
    'kibo',
    'tailark',
    'cult',
    'coss',
    'prompt-kit',
    'supabase',
    'blocks-so',
    'evilcharts',
    'shadcnblocks',
  ];
  /** @type {Record<string, Array<{ path: string, sha256: string }>>} */
  const files = {};
  for (const ns of namespaces) {
    const dir = join(templateRoot, 'src/components', ns);
    try {
      await stat(dir);
      files[ns] = await walkDir(dir, templateRoot);
    } catch {
      files[ns] = [];
    }
  }

  const lock = {
    version: 1,
    generatedAt: new Date().toISOString(),
    componentCount: catalog.length,
    files,
  };

  if (!dryRun) {
    await writeFile(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  }
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const opts = {
    dryRun: false,
    limit: undefined,
    sources: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--limit') opts.limit = Number(argv[++i]);
    else if (arg === '--source') opts.sources.push(argv[++i]);
  }
  return opts;
}

/**
 * @param {string} authEnv
 * @returns {Promise<{ ok: boolean, team?: string, requestsRemaining?: number }>}
 */
async function verify21stAuth(authEnv) {
  const token = process.env[authEnv] ?? process.env.AN_API_KEY;
  if (!token) {
    console.warn(`[21st] ${authEnv} unset — skipping 21st.dev sync`);
    return { ok: false };
  }
  const res = await fetch('https://21st.dev/api/v1/registry/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.warn(`[21st] auth verify failed: HTTP ${res.status}`);
    return { ok: false };
  }
  const data = await res.json();
  console.log(
    `[21st] authenticated as ${data.user?.email ?? 'unknown'} — team "${data.team?.name ?? 'Personal'}" — ${data.requestsRemaining ?? '?'} requests remaining`,
  );
  return { ok: true, team: data.team?.name, requestsRemaining: data.requestsRemaining };
}

/**
 * @param {string} templateRoot
 * @param {string} sourceId
 * @param {SourceConfig & { authEnv?: string, installPath?: string, searchQueries?: string[], urls?: string[] }} source
 * @param {{ dryRun: boolean, limit?: number }} opts
 */
async function sync21stRegistrySource(templateRoot, sourceId, source, opts) {
  const authEnv = source.authEnv ?? 'API_KEY_21ST';
  const verified = await verify21stAuth(authEnv);
  if (!verified.ok) {
    return [];
  }

  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);
  const token = process.env[authEnv] ?? process.env.AN_API_KEY ?? '';
  const env = { ...process.env, [authEnv]: token, AN_API_KEY: token };
  const installPath = source.installPath ?? `src/components/${source.namespace}`;
  const slugs = new Set(source.urls ?? []);

  for (const query of source.searchQueries ?? ['hero pricing dashboard auth settings']) {
    try {
      const { stdout } = await exec(
        'npx',
        ['-y', '@21st-dev/registry@latest', 'search', query, '--json'],
        { cwd: join(REPO_ROOT, 'templates/web'), env, timeout: 120_000 },
      );
      const parsed = JSON.parse(stdout);
      const items = Array.isArray(parsed) ? parsed : (parsed.results ?? parsed.items ?? []);
      for (const item of items) {
        const slug = item.slug ?? item.name ?? item.id;
        if (typeof slug === 'string') {
          slugs.add(slug);
        }
      }
    } catch (error) {
      console.warn(`[21st] search "${query}" failed: ${error.message}`);
    }
  }

  const slice = opts.limit ? [...slugs].slice(0, opts.limit) : [...slugs];
  const results = [];

  for (const slug of slice) {
    try {
      if (!opts.dryRun) {
        await exec(
          'npx',
          ['-y', '@21st-dev/registry@latest', 'add', slug, '--path', installPath, '-y'],
          { cwd: join(REPO_ROOT, 'templates/web'), env, timeout: 120_000 },
        );
      }
      const componentName = slug.includes('/')
        ? slug.split('/').pop()
        : slug.replace(/^@/, '').replace(/\//g, '-');
      const catalogNamespace = source.catalogNamespace ?? 'blocks-21st';
      results.push({
        source: sourceId,
        namespace: catalogNamespace,
        name: componentName,
        paths: [`${installPath}/${componentName}.tsx`],
        dependencies: [],
        tags: source.tags ?? ['blocks', 'community'],
        portable: true,
        category: classifyCategory(componentName ?? slug, {}, source.tags ?? [], catalogNamespace),
      });
    } catch (error) {
      const msg = error.stderr?.toString() ?? error.message ?? String(error);
      if (/marketplace membership required/i.test(msg)) {
        console.warn(`[21st] skip premium ${slug}: marketplace membership required`);
      } else {
        console.warn(`[21st] skip ${slug}: ${msg.slice(0, 200)}`);
      }
    }
  }
  return results;
}

/**
 * @param {string} templateRoot
 * @param {boolean} dryRun
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function loadExistingCatalog(templateRoot) {
  try {
    const raw = await readFile(join(templateRoot, '.vybekiit/agent/ui-catalog-index.json'), 'utf8');
    const index = JSON.parse(raw);
    return index.components ?? [];
  } catch {
    return [];
  }
}

/**
 * @param {Array<Record<string, unknown>>} existing
 * @param {Array<Record<string, unknown>>} incoming
 * @param {string[]} sourceIds
 */
function mergeCatalog(existing, incoming, sourceIds) {
  const filtered = existing.filter((entry) => !sourceIds.includes(String(entry.source)));
  return filtered.concat(incoming);
}

/** Known stale paths from pre-fix BundUI collisions. */
const BUNDUI_ORPHAN_FILES = ['src/components/bundui/page.tsx', 'src/components/bundui/abc.tsx'];

/**
 * @param {string} templateRoot
 * @param {boolean} dryRun
 */
async function removeBunduiOrphans(templateRoot, dryRun) {
  for (const rel of BUNDUI_ORPHAN_FILES) {
    const full = join(templateRoot, rel);
    try {
      await stat(full);
      if (!dryRun) {
        await unlink(full);
      }
      console.log(`    removed orphan ${rel}`);
    } catch {
      // already gone
    }
  }
}

function buildSkipNames(existingCatalog, source) {
  /** @type {Set<string>} */
  const skip = new Set(source.skipNames ?? []);
  for (const entry of existingCatalog) {
    const entrySource = String(entry.source ?? '');
    if (entrySource === source.namespace) {
      continue;
    }
    if (!LEGACY_DEDUP_SOURCES.has(entrySource)) {
      continue;
    }
    if (typeof entry.name === 'string') {
      skip.add(entry.name);
    }
  }
  return skip;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const templateRoot = join(REPO_ROOT, manifest.templateRoot);

  /** @type {Array<Record<string, unknown>>} */
  let catalog = [];

  const sourceEntries = Object.entries(manifest.sources).filter(([id]) =>
    opts.sources.length === 0 ? true : opts.sources.includes(id),
  );

  const sourceIds = sourceEntries.map(([id]) => id);
  const existingCatalog = await loadExistingCatalog(templateRoot);

  for (const [sourceId, source] of sourceEntries) {
    console.log(`\n==> Syncing ${sourceId} (${source.type})`);
    let results = [];
    if (source.type === 'shadcn-registry') {
      const skipNames = buildSkipNames(existingCatalog, source);
      results = await syncShadcnRegistrySource(templateRoot, sourceId, source, opts, skipNames);
    } else if (source.type === 'shadcn-url') {
      results = await syncShadcnUrlSource(templateRoot, sourceId, source, opts);
    } else if (source.type === '21st-registry') {
      results = await sync21stRegistrySource(templateRoot, sourceId, source, opts);
    } else if (source.type === 'github-tree') {
      results = await syncGithubTreeSource(templateRoot, sourceId, source, opts);
    }
    catalog = catalog.concat(results);
    console.log(`    ${results.length} components synced`);
  }

  if (existingCatalog.length > 0) {
    catalog = mergeCatalog(existingCatalog, catalog, sourceIds);
  }

  if (opts.sources.length === 0 || opts.sources.includes('bundui')) {
    await removeBunduiOrphans(templateRoot, opts.dryRun);
  }

  await writeCatalogIndexes(templateRoot, catalog, opts.dryRun);
  await writeLockFile(templateRoot, catalog, opts.dryRun);
  await collectNpmDependencies(catalog, opts.dryRun);

  if (!opts.dryRun) {
    try {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const exec = promisify(execFile);
      await exec('node', ['scripts/dev/mirror/auditMirrorDeps.mjs'], { cwd: REPO_ROOT });
      await exec('node', ['scripts/dev/sync/buildSaasShowcaseManifest.mjs'], { cwd: REPO_ROOT });
      await exec('node', ['scripts/dev/sync/buildComponentLibraryIndex.mjs'], { cwd: REPO_ROOT });
    } catch (error) {
      console.warn(`Post-sync hook warning: ${error.message}`);
    }
  }

  console.log(`\nDone. ${catalog.length} catalog entries.`);
  if (opts.dryRun) {
    console.log('(dry-run — no files written)');
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export {
  classifyCategory,
  discoverRegistryItems,
  ensureRegistryDependencies,
  inferCategory,
  inferKind,
  inferTags,
  isPortable,
  passesRegistryFilter,
  resolveTargetPath,
  shouldSkipMirrorFile,
};
