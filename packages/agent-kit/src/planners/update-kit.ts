import { type Result, fail, ok } from '@vybekiit/core';

/**
 * One package that has a newer published version than what the buyer has installed.
 *
 * `name` is the `@vybekiit/*` package; `from`/`to` are the clean `x.y.z` versions
 * (any leading `^`/`~` already stripped) so a skill can say "I can move accounts
 * from 0.1.0 to 0.2.0" in plain words.
 */
export interface KitPackageUpdate {
  readonly name: string;
  readonly from: string;
  readonly to: string;
}

/**
 * The result of comparing a buyer's installed kit versions against the latest
 * published ones — the plan the `update-kit` skill executes.
 *
 * `updates` lists only packages with a strictly newer version (empty means "you're
 * up to date"); `upToDate` is the convenience flag so the skill can branch without
 * re-checking the array length.
 */
export interface UpdatePlan {
  readonly updates: readonly KitPackageUpdate[];
  readonly upToDate: boolean;
}

/** A `x.y.z` version split into its three numeric parts. */
type SemverParts = readonly [number, number, number];

/**
 * Parse a clean `x.y.z` version (optionally prefixed with `^` or `~`) into its
 * numeric parts, or `null` if it isn't well-formed.
 *
 * Intentionally strict — handles only plain three-part semver, which is all our
 * controlled `@vybekiit/*` versions ever use. Pre-release/build metadata is out of
 * scope on purpose, so we don't pull in a semver dependency.
 */
function parseVersion(version: string): SemverParts | null {
  const match = /^[\^~]?(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return null;
  const [, major, minor, patch] = match;
  return [Number(major), Number(minor), Number(patch)];
}

/**
 * Compare two clean `x.y.z` versions: returns -1 if `a < b`, 1 if `a > b`, 0 if
 * equal, or `null` if either side isn't well-formed semver.
 *
 * Handles clean semver only (a leading `^`/`~` is stripped); sufficient for our
 * controlled `@vybekiit/*` versions, so no semver dependency is needed.
 */
function compareVersions(a: string, b: string): -1 | 0 | 1 | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!(left && right)) return null;
  const [leftMajor, leftMinor, leftPatch] = left;
  const [rightMajor, rightMinor, rightPatch] = right;
  if (leftMajor !== rightMajor) return leftMajor < rightMajor ? -1 : 1;
  if (leftMinor !== rightMinor) return leftMinor < rightMinor ? -1 : 1;
  if (leftPatch !== rightPatch) return leftPatch < rightPatch ? -1 : 1;
  return 0;
}

/**
 * Compute which of the buyer's installed `@vybekiit/*` packages have a newer
 * published version.
 *
 * Backs the `update-kit` skill: given the installed versions (from the buyer's
 * `package.json`) and the latest published versions (from npm), it returns a plan
 * of just the upgrades. A package is only included when `latest` is strictly newer
 * than `installed`; packages missing from `latest` are skipped (nothing newer to
 * offer). Returns a {@link Result} so a single malformed version surfaces as a
 * translatable failure rather than a silently-wrong plan.
 *
 * @param installed - installed versions keyed by `@vybekiit/*` package name
 * @param latest - latest published versions keyed by the same names
 */
export function planKitUpdate(
  installed: Record<string, string>,
  latest: Record<string, string>,
): Result<UpdatePlan> {
  const updates: KitPackageUpdate[] = [];
  for (const [name, installedVersion] of Object.entries(installed)) {
    const latestVersion = latest[name];
    if (latestVersion === undefined) continue;
    const order = compareVersions(installedVersion, latestVersion);
    if (order === null) {
      return fail(
        'malformed_version',
        `Cannot compare versions for ${name}: "${installedVersion}" vs "${latestVersion}".`,
      );
    }
    if (order === -1) {
      updates.push({ name, from: installedVersion, to: latestVersion });
    }
  }
  return ok({ updates, upToDate: updates.length === 0 });
}
