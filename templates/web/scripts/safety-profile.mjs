/**
 * safety-profile.mjs — what makes THIS project's safety check specific to its stack.
 *
 * The catalog (what counts as a leak) and the scanner (how it looks) are the same in every
 * vybekiit project. This tiny file is the only part that differs, because each kind of app
 * exposes secrets differently. It is meant to be read: in plain data, it says how your app
 * ships code to people and where a leaked key would end up.
 *
 * This project is a Next.js web app.
 */
export const PROFILE = {
  stack: 'next',
  // Env vars whose name starts with this are sent to the browser on purpose. A real secret
  // behind such a name is a leak, because it gets baked into the public page.
  publicPrefix: /\bNEXT_PUBLIC_/,
  // Next.js keeps server code on the server, so a key in a normal source file does not ship.
  everythingShips: false,
  // Where "source maps" (readable copies of your code) could be turned on for the whole site.
  sourcemapConfigs: [{ file: 'next.config.ts', re: /productionBrowserSourceMaps\s*:\s*true/ }],
  // Vetted, mirrored UI folders. The deeper code checks skip these to avoid false alarms;
  // the secret check still scans everything, everywhere.
  skipPaths: ['/src/components/'],
};
