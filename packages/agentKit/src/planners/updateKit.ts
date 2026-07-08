import { Data, Effect } from 'effect';

/**
 * One package that has a newer published version than what the buyer has installed.
 *
 * `name` is the `@vybekiit/*` package; `from`/`to` are the clean `x.y.z` versions
 * (any leading `^`/`~` already stripped) so a skill can say "I can move accounts
 * from 0.1.0 to 0.2.0" in plain words.
 */
export type KitPackageUpdate = {
  readonly name: string;
  readonly from: string;
  readonly to: string;
};

/**
 * The result of comparing a buyer's installed kit versions against the latest
 * published ones — the plan the `update-kit` skill executes.
 *
 * `updates` lists only packages with a strictly newer version (empty means "you're
 * up to date"); `upToDate` is the convenience flag so the skill can branch without
 * re-checking the array length.
 */
export type UpdatePlan = {
  readonly updates: readonly KitPackageUpdate[];
  readonly upToDate: boolean;
};

/** Expected update-kit planning failure. */
export class UpdateKitError extends Data.TaggedError('UpdateKitError')<{
  readonly code: 'malformed_version';
  readonly message: string;
}> {}

/** A `x.y.z` version split into its three numeric parts. */
type SemverParts = readonly [number, number, number];

// "^1.2.3" -> ["1", "2", "3"]
const CLEAN_SEMVER_PATTERN = /^[\^~]?(\d+)\.(\d+)\.(\d+)$/;

/**
 * Parse a clean `x.y.z` version (optionally prefixed with `^` or `~`) into its
 * numeric parts, or `null` if it isn't well-formed.
 *
 * Intentionally strict — handles only plain three-part semver, which is all our
 * controlled `@vybekiit/*` versions ever use. Pre-release/build metadata is out of
 * scope on purpose, so we don't pull in a semver dependency.
 */
const parseVersion = (version: string): SemverParts | null => {
  const match = CLEAN_SEMVER_PATTERN.exec(version.trim());
  if (!match) {
    return null;
  }
  const [, major, minor, patch] = match;
  return [Number(major), Number(minor), Number(patch)];
};

/**
 * Compare two clean `x.y.z` versions: returns -1 if `a < b`, 1 if `a > b`, 0 if
 * equal, or `null` if either side isn't well-formed semver.
 *
 * Handles clean semver only (a leading `^`/`~` is stripped); sufficient for our
 * controlled `@vybekiit/*` versions, so no semver dependency is needed.
 */
const compareVersions = (a: string, b: string): -1 | 0 | 1 | null => {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!(left && right)) {
    return null;
  }
  const [leftMajor, leftMinor, leftPatch] = left;
  const [rightMajor, rightMinor, rightPatch] = right;
  if (leftMajor !== rightMajor) {
    return leftMajor < rightMajor ? -1 : 1;
  }
  if (leftMinor !== rightMinor) {
    return leftMinor < rightMinor ? -1 : 1;
  }
  if (leftPatch !== rightPatch) {
    return leftPatch < rightPatch ? -1 : 1;
  }
  return 0;
};

/**
 * Compute which of the buyer's installed `@vybekiit/*` packages have a newer
 *
 * @param installed - installed input.
 * @param latest - latest input.
 * @returns Effect that succeeds with the update plan or fails with UpdateKitError.
 * @example
 * const plan = await Effect.runPromise(planKitUpdate(installed, latest));
 */
export const planKitUpdate = (
  installed: Record<string, string>,
  latest: Record<string, string>,
): Effect.Effect<UpdatePlan, UpdateKitError> => {
  const updates: KitPackageUpdate[] = [];
  for (const [name, installedVersion] of Object.entries(installed)) {
    const latestVersion = latest[name];
    if (latestVersion !== undefined) {
      const order = compareVersions(installedVersion, latestVersion);
      if (order === null) {
        return Effect.fail(
          new UpdateKitError({
            code: 'malformed_version',
            message: `Cannot compare versions for ${name}: "${installedVersion}" vs "${latestVersion}".`,
          }),
        );
      }
      if (order === -1) {
        updates.push({ name, from: installedVersion, to: latestVersion });
      }
    }
  }
  return Effect.succeed({ updates, upToDate: updates.length === 0 });
};
