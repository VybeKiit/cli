import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

/** @param {string} specifier */
function resolveWorkspaceImport(specifier) {
  const paths = JSON.parse(readFileSync(join(ROOT, 'tsconfig.base.json'), 'utf8')).compilerOptions
    .paths;

  for (const [pattern, targets] of Object.entries(paths)) {
    const starIdx = pattern.indexOf('*');
    if (starIdx === -1) {
      if (specifier !== pattern) continue;
      return fileOrIndex(resolve(ROOT, targets[0]));
    }

    const prefix = pattern.slice(0, starIdx);
    const suffix = pattern.slice(starIdx + 1);
    if (!specifier.startsWith(prefix)) continue;
    if (suffix && !specifier.endsWith(suffix)) continue;

    const captured = specifier.slice(
      prefix.length,
      suffix ? specifier.length - suffix.length : undefined,
    );
    // Swap `*` in tsconfig path — e.g. `@vybekiit/auth/*` + `http` → `packages/auth/src/http`
    const target = targets[0].replace('*', captured);
    const resolved = fileOrIndex(resolve(ROOT, target));
    if (resolved) return resolved;
  }
}

/** @param {string} abs */
function fileOrIndex(abs) {
  if (existsSync(abs)) {
    if (statSync(abs).isDirectory()) {
      const indexTs = join(abs, 'index.ts');
      if (existsSync(indexTs)) return indexTs;
    } else {
      return abs;
    }
  }
  if (existsSync(`${abs}.ts`)) return `${abs}.ts`;
  const indexTs = join(abs, 'index.ts');
  if (existsSync(indexTs)) return indexTs;
}

/** esbuild plugin so tsup can bundle `@vybekiit/*` self-imports during build. */
export function createWorkspaceAliasPlugin() {
  return {
    name: 'vybekiit-workspace-alias',
    setup(build) {
      // Only `@vybekiit/...` imports — e.g. `@vybekiit/auth/http` matches, `./foo` does not
      build.onResolve({ filter: /^@vybekiit\// }, (args) => {
        const resolved = resolveWorkspaceImport(args.path);
        return resolved ? { path: resolved } : undefined;
      });
    },
  };
}

/** Vite/Vitest plugin — same `@vybekiit/*` resolution for tests. */
export function createViteWorkspaceAliasPlugin() {
  return {
    name: 'vybekiit-workspace-alias',
    resolveId(source) {
      if (!source.startsWith('@vybekiit/')) return;
      return resolveWorkspaceImport(source);
    },
  };
}
