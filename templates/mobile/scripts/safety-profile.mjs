/**
 * safety-profile.mjs — what makes THIS project's safety check specific to its stack.
 *
 * The catalog (what counts as a leak) and the scanner (how it looks) are the same in every
 * vybekiit project. This tiny file is the only part that differs, because each kind of app
 * exposes secrets differently. It is meant to be read: in plain data, it says how your app
 * ships code to people and where a leaked key would end up.
 *
 * This project is an Expo / React Native mobile app.
 */
export const PROFILE = {
  stack: 'expo',
  // Expo bakes any EXPO_PUBLIC_ value into the app people download. A real secret behind such
  // a name reaches every phone that installs the app.
  publicPrefix: /\bEXPO_PUBLIC_/,
  // A mobile app ships its whole JavaScript bundle inside the download, so ANY key written
  // into the app's code travels to every device that installs it.
  everythingShips: true,
  // Metro does not ship browser source maps to the device, so there is nothing to check here.
  sourcemapConfigs: [],
  // Vetted, mirrored UI folders. The deeper code checks skip these to avoid false alarms;
  // the secret check still scans everything, everywhere.
  skipPaths: ['/src/components/'],
};
