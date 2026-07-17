import process from 'node:process';
import { checkAccess } from '../doctor/gate';
import { runDoctor } from '../doctor/run';
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
  // every project, with a single confirmation. This is the whole point of setup for a
  // non-technical builder — without it the CLI only scaffolds and "nothing feels different".
  await runGlobalInstall([]);

  const access = checkAccess();

  process.stdout.write('\n');
  for (const line of formatSetupNextStep({
    doctorExitCode: code,
    gateReason: access.reason,
  })) {
    process.stdout.write(`${line}\n`);
  }

  return code;
};
