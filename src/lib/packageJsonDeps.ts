import { readFile, writeFile } from 'node:fs/promises';

/** Minimal `package.json` shape we mutate: only the `dependencies` block plus untouched fields. */
type MutablePackageJson = {
  dependencies?: Record<string, string>;
  readonly [key: string]: unknown;
};

/**
 * Upsert only missing dependency keys into a `package.json`, never downgrading an
 * existing version. Mirrors the read → parse → mutate → write shape of `pinDeps`
 * (`dropFiles.ts`), but adds instead of rewriting `workspace:*`.
 *
 * A missing or unreadable `package.json` is a no-op (non-Node destinations are fine).
 *
 * @param pkgPath - Absolute path to the destination `package.json`.
 * @param deps - Name → version map to ensure is present.
 * @returns The dependency names that were newly added (empty when all already present).
 * @example
 * const added = await ensureDependencies('/app/package.json', { sonner: '^2.0.7' });
 */
export const ensureDependencies = async (
  pkgPath: string,
  deps: Record<string, string>,
): Promise<readonly string[]> => {
  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch {
    return [];
  }

  const pkg = JSON.parse(raw) as MutablePackageJson;
  const dependencies = pkg.dependencies ?? {};
  const added: string[] = [];
  for (const [name, version] of Object.entries(deps)) {
    if (dependencies[name] === undefined) {
      dependencies[name] = version;
      added.push(name);
    }
  }

  if (added.length === 0) {
    return [];
  }

  pkg.dependencies = dependencies;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return added;
};
