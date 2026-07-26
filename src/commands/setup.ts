import process from 'node:process';
import { checkAccess } from '../doctor/gate';
import { runDoctor } from '../doctor/run';
import { resolveGlobalPaths } from '../global/globalPaths';
import { readInstallState } from '../global/installState';
import { runGlobalInstall } from '../global/runGlobalInstall';
import { playWelcomeBanner } from '../ui/welcomeBanner';
import { formatSetupNextStep } from './setupNextStep';

/**
 * Run the post-purchase welcome flow, full doctor, and honest next step.
 *
 * @returns Process exit code from the doctor command (access issues still print guidance).
 * @example
 * const exitCode = await runSetup();
 */
export const runSetup = async (): Promise<number> => {
  await playWelcomeBanner();
  const code = await runDoctor();

  // Provision Claude Code globally (skills + MCP + awareness) so the buyer gets VybeKiit in
  // every project. Always `--yes` after entitlement: the confirm was a silent-skip path for
  // non-coders (and non-TTY), so Claude never loaded kit skills. `global-install` without
  // flags still prompts when run alone. First install also runs Session #1 (web app + Claude).
  await runGlobalInstall(['--yes']);

  const access = checkAccess();
  const installState = await readInstallState(resolveGlobalPaths().configDir);

  process.stdout.write('\n');
  for (const line of formatSetupNextStep({
    doctorExitCode: code,
    gateReason: access.reason,
    ...(installState?.firstAppPath === undefined
      ? {}
      : { firstAppPath: installState.firstAppPath }),
  })) {
    process.stdout.write(`${line}\n`);
  }

  return code;
};
