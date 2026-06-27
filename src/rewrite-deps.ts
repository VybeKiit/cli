/** Dependency map as it appears in a `package.json`. */
export type DependencyMap = Record<string, string>;

/**
 * Replace `workspace:*` ranges on `@vybekiit/*` packages with a pinned npm range.
 *
 * This is the hinge of the Owned-vs-Maintained model: inside our monorepo the
 * templates consume the packages via `workspace:*`, but a *buyer's* scaffolded
 * repo must consume them from npm. The scaffolder rewrites those ranges to
 * `^<version>` so the buyer gets real, version-bumpable dependencies — the only
 * kind of update a non-coder's agent can apply safely. Pure so the rewrite rule
 * stays unit-tested and can't silently regress.
 *
 * @param deps - a dependencies/devDependencies map (returned unchanged if absent)
 * @param version - the npm version to pin `@vybekiit/*` packages to
 */
export function rewriteWorkspaceDeps(deps: DependencyMap, version: string): DependencyMap {
  const rewritten: DependencyMap = {};
  for (const [name, range] of Object.entries(deps)) {
    const isVybeKiitWorkspace = name.startsWith('@vybekiit/') && range.startsWith('workspace:');
    rewritten[name] = isVybeKiitWorkspace ? `^${version}` : range;
  }
  return rewritten;
}
