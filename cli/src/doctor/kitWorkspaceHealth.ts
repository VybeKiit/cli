import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export type KitWorkspaceHealthReport = {
  readonly ok: boolean;
  readonly lines: readonly string[];
};

/** Package whose package.json points at dist but dist is missing. */
type MissingDistPackage = {
  readonly name: string;
  readonly relDir: string;
};

/**
 * Read package.json when present; return null on missing/invalid files.
 *
 * @param packageJsonPath - Absolute path to package.json.
 * @returns Parsed object, or null.
 */
const readPackageJsonSafe = (packageJsonPath: string): Record<string, unknown> | null => {
  if (!existsSync(packageJsonPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
};

/**
 * Whether this package expects a built `dist/` (main/module/exports point at dist).
 *
 * @param pkg - package.json body.
 * @returns True when consumers resolve through dist.
 */
const packageExpectsDist = (pkg: Record<string, unknown>): boolean => {
  const main = typeof pkg.main === 'string' ? pkg.main : '';
  const moduleField = typeof pkg.module === 'string' ? pkg.module : '';
  if (main.includes('dist/') || moduleField.includes('dist/')) {
    return true;
  }
  const exportsField = pkg.exports;
  if (typeof exportsField === 'string') {
    return exportsField.includes('dist/');
  }
  if (exportsField !== null && typeof exportsField === 'object') {
    return JSON.stringify(exportsField).includes('dist/');
  }
  return false;
};

/**
 * Collect package directories one level under packages/ (and packages/tools/*).
 *
 * @param packagesRoot - Absolute packages directory.
 * @returns Relative package dirs from packagesRoot.
 */
const listPackageRelDirs = (packagesRoot: string): readonly string[] => {
  if (!existsSync(packagesRoot)) {
    return [];
  }

  const top = readdirSync(packagesRoot);
  const rels: string[] = [];

  for (const entry of top) {
    const abs = join(packagesRoot, entry);
    let isDir = false;
    try {
      isDir = statSync(abs).isDirectory();
    } catch {
      continue;
    }
    if (!isDir) {
      continue;
    }
    if (existsSync(join(abs, 'package.json'))) {
      rels.push(entry);
      continue;
    }
    // Nested tools/* packages
    let nested: string[] = [];
    try {
      nested = readdirSync(abs);
    } catch {
      continue;
    }
    for (const child of nested) {
      const childAbs = join(abs, child);
      try {
        if (statSync(childAbs).isDirectory() && existsSync(join(childAbs, 'package.json'))) {
          rels.push(join(entry, child));
        }
      } catch {
        // skip unreadable
      }
    }
  }

  return rels;
};

/**
 * Find workspace packages that declare dist exports but have no dist folder.
 *
 * @param cwd - Project or kit workspace root.
 * @returns Missing-dist package list.
 */
const findMissingDistPackages = (cwd: string): readonly MissingDistPackage[] => {
  const packagesRoot = join(cwd, 'packages');
  const missing: MissingDistPackage[] = [];

  for (const relDir of listPackageRelDirs(packagesRoot)) {
    const packageDir = join(packagesRoot, relDir);
    const pkg = readPackageJsonSafe(join(packageDir, 'package.json'));
    if (pkg === null || !packageExpectsDist(pkg)) {
      continue;
    }
    if (!existsSync(join(packageDir, 'dist'))) {
      const name = typeof pkg.name === 'string' ? pkg.name : relDir;
      missing.push({ name, relDir });
    }
  }

  return missing;
};

/**
 * Verify kit-workspace package builds so `pnpm dev` can resolve `@vybekiit/*`.
 *
 * No-ops (ok) when `packages/` is absent — not every project is a kit workspace.
 *
 * @param cwd - Project directory to inspect.
 * @returns Health report with remediation lines.
 * @example
 * const report = verifyKitWorkspaceHealth(process.cwd());
 */
export const verifyKitWorkspaceHealth = (cwd: string): KitWorkspaceHealthReport => {
  const packagesRoot = join(cwd, 'packages');
  if (!existsSync(packagesRoot)) {
    return { ok: true, lines: [] };
  }

  const lines: string[] = [];
  let ok = true;

  const missing = findMissingDistPackages(cwd);
  if (missing.length === 0) {
    lines.push('✓ Kit packages have built outputs (dist/) for first-run preview');
  } else {
    ok = false;
    const sample = missing
      .slice(0, 5)
      .map((row) => row.name)
      .join(', ');
    const more = missing.length > 5 ? ` (+${missing.length - 5} more)` : '';
    lines.push(
      `✗ Package builds missing for: ${sample}${more}. Run \`pnpm build:packages\` from the kit root (or rebuild the monorepo packages), then retry preview.`,
    );
  }

  const buildRoots = ['tsconfig.base.json', 'scripts/lib/tsupWorkspaceAliases.mjs'] as const;
  const missingRoots = buildRoots.filter((rel) => !existsSync(join(cwd, rel)));
  if (missingRoots.length > 0 && missing.length > 0) {
    lines.push(
      `✗ Kit is also missing rebuild helpers (${missingRoots.join(', ')}). Re-run \`vybekiit create app\` with a current CLI so build roots ship with the workspace.`,
    );
  } else if (missingRoots.length === 0) {
    lines.push('✓ Kit rebuild helpers present (tsconfig.base + tsup aliases)');
  }

  return { ok, lines };
};
