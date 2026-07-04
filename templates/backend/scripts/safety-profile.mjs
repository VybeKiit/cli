/**
 * safety-profile.mjs — what makes THIS project's safety check specific to its stack.
 *
 * The catalog (what counts as a leak) and the scanner (how it looks) are the same in every
 * vybekiit project. This tiny file is the only part that differs, because each kind of app
 * exposes secrets differently. It is meant to be read: in plain data, it says how your app
 * ships code to people and where a leaked key would end up.
 *
 * This project is an Express server. It has no client bundle: nothing here is downloaded by a
 * visitor, so a key in a source file stays on the server. That does NOT make keys safe to hard
 * code — a committed key still leaks through your project history — it just means "visible to
 * visitors" is not a way a server leaks.
 */
export const PROFILE = {
  stack: 'express',
  // A server has no public bundle, so there is no "public" env prefix.
  publicPrefix: null,
  // The server does not ship its code to anyone, so a key in a source file does not travel.
  everythingShips: false,
  // No browser build, so no source maps to leak.
  sourcemapConfigs: [],
  // No mirrored UI on a server; the deeper checks scan all of the code.
  skipPaths: [],
};
