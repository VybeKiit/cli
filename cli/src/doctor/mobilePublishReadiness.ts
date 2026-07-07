import type { Platform } from './toolchain';

export type MobilePublishReadinessReport = {
  /** False only when macOS iOS tooling (Xcode) is missing for a mobile project. */
  readonly ok: boolean;
  readonly lines: readonly string[];
};

export type CommandProbe = {
  readonly succeeds: (command: string, args: readonly string[]) => boolean;
  readonly output: (command: string, args: readonly string[]) => string;
};

const XCODE_APP_STORE_URL = 'https://apps.apple.com/app/xcode/id497799835';
const APPLE_DEVELOPER_URL = 'https://developer.apple.com/programs/enroll/';
const GOOGLE_PLAY_CONSOLE_URL = 'https://play.google.com/console/signup';
// Example line: 1) ABCD1234 "Apple Development: Name (TEAMID)"
const APPLE_CODESIGNING_IDENTITY_PATTERN = /Apple (Development|Distribution):/i;

/**
 * Detect whether macOS has an Apple code-signing identity.
 *
 * @param output - `security find-identity` output.
 * @returns True when a development or distribution identity is present.
 * @example
 * const hasIdentity = hasAppleCodesigningIdentity(output);
 */
const hasAppleCodesigningIdentity = (output: string): boolean =>
  APPLE_CODESIGNING_IDENTITY_PATTERN.test(output);

/**
 * Detect whether Android store credentials are configured.
 *
 * @param env - Merged doctor environment.
 * @returns True when any recognized credential hint exists.
 * @example
 * const hasCredentials = hasGooglePlayCredentialHint(process.env);
 */
const hasGooglePlayCredentialHint = (env: Record<string, string | undefined>): boolean =>
  Boolean(
    env.GOOGLE_SERVICE_ACCOUNT_JSON ||
      env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
      env.EXPO_ANDROID_KEYSTORE_PATH ||
      env.ANDROID_KEYSTORE_PATH,
  );

/**
 * iOS/Android store readiness hints for mobile projects — Xcode on macOS, Apple Developer
 * Program enrollment, and Google Play Console registration. Store accounts cannot be
 * installed by doctor; we probe what we can and spell out the one-time enrollments.
 *
 * @param platform - Current OS family.
 * @param env - Environment values used to detect publish credentials.
 * @param probe - Command probe used for local tool and signing checks.
 * @returns Mobile publish readiness report.
 * @example
 * const report = verifyMobilePublishReadiness('darwin', process.env, probe);
 */
export const verifyMobilePublishReadiness = (
  platform: Platform,
  env: Record<string, string | undefined>,
  probe: CommandProbe,
): MobilePublishReadinessReport => {
  const lines: string[] = [];
  let ok = true;

  if (platform === 'darwin') {
    if (probe.succeeds('xcodebuild', ['-version'])) {
      const [rawVersionLine] = probe.output('xcodebuild', ['-version']).split('\n');
      const versionLine =
        rawVersionLine !== undefined && rawVersionLine.trim() !== ''
          ? rawVersionLine.trim()
          : 'installed';
      lines.push(
        `✓ Xcode - ${versionLine} (install the latest stable release from the Mac App Store before TestFlight or App Store uploads).`,
      );
    } else {
      ok = false;
      lines.push(
        `✗ Xcode - not found. Install the latest stable Xcode from the Mac App Store before iOS builds or TestFlight: ${XCODE_APP_STORE_URL}`,
      );
    }

    const signingOutput = probe.output('security', ['find-identity', '-v', '-p', 'codesigning']);
    if (hasAppleCodesigningIdentity(signingOutput)) {
      lines.push(
        '✓ Apple Developer - code signing identity found (needed for device builds, TestFlight, and App Store).',
      );
    } else {
      lines.push(
        `→ Apple Developer Program - enroll ($99/year) and create signing credentials before store uploads: ${APPLE_DEVELOPER_URL}`,
      );
    }
  } else {
    lines.push(
      '→ iOS builds and TestFlight require macOS with the latest stable Xcode - use EAS cloud builds if you are on another OS.',
    );
  }

  if (hasGooglePlayCredentialHint(env)) {
    lines.push('✓ Google Play - Android signing or Play Console service account env detected.');
  } else {
    lines.push(
      `→ Google Play Console - register a developer account ($25 one-time) before Android store uploads: ${GOOGLE_PLAY_CONSOLE_URL}`,
    );
  }

  return { ok, lines };
};

/**
 * Create the default command probe backed by synchronous process execution.
 *
 * @param spawnSync - Synchronous spawn implementation, injected by tests.
 * @returns Command probe for readiness checks.
 * @example
 * const probe = createDefaultCommandProbe(spawnSync);
 */
export const createDefaultCommandProbe = (
  spawnSync: (
    command: string,
    args: readonly string[],
    options: { encoding: 'utf8'; stdio: 'pipe' },
  ) => { status: number | null; stdout: string; stderr: string },
): CommandProbe => ({
  succeeds(command, args) {
    return spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' }).status === 0;
  },
  output(command, args) {
    const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' });
    return `${result.stdout}\n${result.stderr}`.trim();
  },
});
