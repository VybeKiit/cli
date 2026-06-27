import { defineConfig } from 'launch-store';

/**
 * Launch (launch-store) deploy config for this Expo app.
 *
 * App FACTS (bundle id, version, capabilities) live in `app.json` — Launch reads
 * them straight from Expo's config, exactly where EAS reads them. This file holds
 * only Launch's own settings: where to find the app, where credentials/artifacts
 * live, and which build engine to use.
 *
 * Why these defaults for a non-coder:
 *  - buildEngine `eas`  → builds run in Expo's cloud, so you need NO Mac and no
 *    local Xcode/Android toolchain. Alternatives: `fastlane` (local, needs a Mac
 *    for iOS) or `remote-mac` (your own AWS EC2 Mac). Switch here when you outgrow it.
 *  - credentials `local` → your Apple/Play signing keys stay in the OS keychain,
 *    never in this repo.
 *  - storage `local` → build artifacts go to `~/.launch/artifacts`. Swap for
 *    `s3` / `r2` / `supabase` (plus a `storageConfig` block) when you want shareable
 *    install links and OTA hosting.
 *
 * Run `launch` (the wizard) or `launch doctor` to check your setup before shipping.
 */
export default defineConfig({
  // Every app.json lives under here. This template is a single app beside this config.
  appRoots: ['.'],

  credentials: 'local',
  storage: 'local',
  buildEngine: 'eas',

  profiles: {
    production: {
      name: 'production',
      // Build-time env for this profile, validated against `.env.example`.
      envFile: '.env',
      // Soft-gate: confirm before uploading a build whose download size exceeds this.
      sizeBudgetMB: 200,
    },
  },

  // ── App Store / Play listing details (`launch release`, `launch release-config`) ──
  // Fill these in before your first public submission. Until then the app still
  // builds and installs on a device just fine.
  //
  // TODO(vybekiit): set your App Store age rating, category, and price — skill: publish-app
  // TODO(vybekiit): set the App Review contact (name + email) Apple requires — skill: publish-app
  // release: {
  //   releaseType: 'AFTER_APPROVAL', // go live automatically once Apple approves
  //   usesNonExemptEncryption: false, // standard HTTPS only → clears export compliance
  //   primaryLocale: 'en-US',
  //   releaseNotes: { 'en-US': 'Initial release.' },
  // },
});
