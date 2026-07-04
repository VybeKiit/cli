/**
 * safety-profile.mjs — what makes THIS project's safety check specific to its stack.
 *
 * The catalog (what counts as a leak) and the scanner (how it looks) are the same in every
 * vybekiit project. This tiny file is the only part that differs, because each kind of app
 * exposes secrets differently. It is meant to be read: in plain data, it says how your app
 * ships code to people and where a leaked key would end up.
 *
 * This project is a WXT browser extension.
 */
export const PROFILE = {
  stack: 'wxt',
  // WXT (built on Vite) sends any WXT_PUBLIC_ or VITE_ value to the browser. A real secret
  // behind such a name is a leak, because it ships inside the extension people install.
  publicPrefix: /\bWXT_PUBLIC_|\bVITE_/,
  // A browser extension ships its whole bundle to everyone who installs it, so ANY key in
  // the code is public.
  everythingShips: true,
  // Where source maps (readable copies of your code) could be turned on for the build.
  sourcemapConfigs: [{ file: 'wxt.config.ts', re: /sourcemap\s*:\s*true/ }],
  // Vetted, mirrored UI folders. The deeper code checks skip these to avoid false alarms;
  // the secret check still scans everything, everywhere.
  skipPaths: ['/src/components/'],
};
