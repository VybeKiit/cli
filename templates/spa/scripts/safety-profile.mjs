/**
 * safety-profile.mjs — what makes THIS project's safety check specific to its stack.
 *
 * The catalog (what counts as a leak) and the scanner (how it looks) are the same in every
 * vybekiit project. This tiny file is the only part that differs, because each kind of app
 * exposes secrets differently. It is meant to be read: in plain data, it says how your app
 * ships code to people and where a leaked key would end up.
 *
 * This project is a Vite single-page web app.
 */
export const PROFILE = {
  stack: 'vite',
  // Vite sends every VITE_-prefixed value to the browser. A real secret behind such a name
  // is a leak, because it gets baked into the page anyone can download.
  publicPrefix: /\bVITE_/,
  // A single-page app ships its entire code to the browser, so ANY key in the code is public.
  everythingShips: true,
  // Where source maps (readable copies of your code) could be turned on for the whole site.
  sourcemapConfigs: [{ file: 'vite.config.ts', re: /sourcemap\s*:\s*true/ }],
  // Vetted, mirrored UI folders. The deeper code checks skip these to avoid false alarms;
  // the secret check still scans everything, everywhere.
  skipPaths: ['/src/components/'],
};
