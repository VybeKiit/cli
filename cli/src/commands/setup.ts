import { runDoctor } from '../doctor/run';
import { playWelcomeBanner } from '../ui/welcomeBanner';

/**
 * Run the post-purchase welcome flow and toolchain doctor.
 *
 * @returns Process exit code from the doctor command.
 * @example
 * const exitCode = await runSetup();
 */
export const runSetup = async (): Promise<number> => {
  await playWelcomeBanner();
  const code = await runDoctor();
  process.stdout.write('\n');
  process.stdout.write('Ready: run `vybekiit new` to scaffold your app.\n');
  return code;
};
