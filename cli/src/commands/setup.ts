import { runDoctor } from '../doctor/run';
import { playWelcomeBanner } from '../ui/welcome-banner';

/** Post-purchase welcome: brand banner → toolchain doctor → scaffold CTA. */
export async function runSetup(): Promise<number> {
  await playWelcomeBanner();
  const code = await runDoctor();
  console.log('');
  console.log('Ready — run `vybekiit new` to scaffold your app.');
  return code;
}
