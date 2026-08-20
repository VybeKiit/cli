import process from 'node:process';
import { checkAccess } from '../doctor/gate';
import { runDoctor } from '../doctor/run';
import { globalInstallPaths } from '../global/globalPaths';
import { readInstallState } from '../global/installState';
import { runGlobalInstall } from '../global/runGlobalInstall';
import { isInteractive } from '../prompts/tty';
import { playWelcomeBanner } from '../ui/welcomeBanner';
import { connectSetupServices } from './setupAuthentication';
import { formatSetupNextStep } from './setupNextStep';
import {
  formatSetupIntroduction,
  parseSetupPreferences,
  promptSetupPreferences,
  type SetupPreferences,
  setupEnvironment,
  setupPreferenceFlags,
} from './setupPreferences';

/**
 * Run the post-purchase welcome flow, full doctor, and honest next step.
 *
 * @returns Process exit code from the doctor command (access issues still print guidance).
 * @example
 * const exitCode = await runSetup();
 */
const writeLines = (lines: readonly string[]): void => {
  process.stdout.write(lines.map((line) => `${line}\n`).join(''));
};

const setupPreferences = async (args: readonly string[]): Promise<SetupPreferences | null> => {
  const hasPinnedChoices = args.some(
    (arg) => arg.startsWith('--hosting=') || arg.startsWith('--data='),
  );
  if (isInteractive() && !args.includes('--yes') && !hasPinnedChoices) {
    return await promptSetupPreferences();
  }

  try {
    return parseSetupPreferences(args);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Setup choices are invalid.'}\n`,
    );
    return null;
  }
};

export const runSetup = async (args: readonly string[] = []): Promise<number> => {
  await playWelcomeBanner();
  writeLines(formatSetupIntroduction());
  const preferences = await setupPreferences(args);
  if (preferences === null) {
    return 1;
  }

  const doctorCode = await runDoctor(undefined, {
    preparingFirstApp: true,
    environment: setupEnvironment(preferences),
    wantsGoogleAuth: preferences.googleSignIn,
  });
  if (doctorCode !== 0) {
    process.stderr.write(
      '\nSetup paused because one of the required tools could not be prepared.\n',
    );
    return doctorCode;
  }

  const authentication = connectSetupServices(preferences);
  writeLines(authentication.lines);
  if (!authentication.ok) {
    process.stderr.write(
      '\nSetup paused until the sign-ins above are complete. No success page was opened.\n',
    );
    return 1;
  }

  // Provision Claude Code globally (skills + MCP + awareness) so the buyer gets VybeKiit in
  // every project. Always `--yes` after entitlement: the confirm was a silent-skip path for
  // non-coders (and non-TTY), so Claude never loaded kit skills. `global-install` without
  // flags still prompts when run alone. First install also runs Session #1 (web app + Claude).
  const globalInstallCode = await runGlobalInstall([
    '--yes',
    '--session-one',
    ...setupPreferenceFlags(preferences),
  ]);
  if (globalInstallCode !== 0) {
    process.stderr.write('\nSetup is incomplete. No success page was opened.\n');
    return globalInstallCode;
  }

  const access = checkAccess();
  const installState = await readInstallState(globalInstallPaths().configDir);

  process.stdout.write('\n');
  for (const line of formatSetupNextStep({
    doctorExitCode: doctorCode,
    gateReason: access.reason,
    ...(installState?.firstAppPath === undefined
      ? {}
      : { firstAppPath: installState.firstAppPath }),
  })) {
    process.stdout.write(`${line}\n`);
  }

  return doctorCode;
};
