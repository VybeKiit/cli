import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { baseVerbContext } from '@vybekiit/browserAutomation/cli/verbContext';
import { writeEnvBlock } from '@vybekiit/browserAutomation/core/writeEnvBlock';
import { gdSetupEnvBlock, verifyGdCredentialsViaApi } from './api/verify';
import { runGdSetup, standbyLogin } from './verbs/standbyLogin';

function parseGdSetupArgs(args: string[]): { ote: boolean; keyName?: string } {
  const ote = args.includes('--production') ? false : true;
  let keyName: string | undefined;
  for (const arg of args) {
    if (arg.startsWith('--name=')) keyName = arg.slice('--name='.length);
  }
  return keyName === undefined ? { ote } : { ote, keyName };
}

export function registerGodaddyDomain(registry: CommandRegistry): void {
  registry.register({
    name: 'registrars/godaddy',
    aliases: [],
    commands: {
      standby: {
        description: 'Wait for GoDaddy Developer portal after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin(baseVerbContext(flags));
          if (flags.json) printJson({ ok: result.ready, ...result });
          else if (result.ready) console.log(`OK: GoDaddy Developer ready at ${result.url}`);
          else console.log('Timed out waiting for GoDaddy sign-in.');
          return result.ready ? 0 : 1;
        },
      },
      setup: {
        description: 'Create GoDaddy API key and verify credentials',
        run: async ({ args, flags }) => {
          const params = parseGdSetupArgs(args);
          const result = await runGdSetup(baseVerbContext(flags), params);

          // Persist first — the GoDaddy secret is shown once, so write before verifying to
          // avoid losing it. writeEnvBlock is the "agent never sees the key" enforcement point.
          const env = gdSetupEnvBlock(result);
          const written = await writeEnvBlock({ ...env });

          let verified = true;
          try {
            await verifyGdCredentialsViaApi(result);
          } catch {
            verified = false;
          }

          if (flags.json) {
            // Key-guarded: emit key names, never the secret value.
            printJson({
              ok: verified,
              keysWritten: written.keysWritten,
              ote: result.ote,
              reusedExisting: result.reusedExisting,
              verified,
            });
          } else {
            console.log('OK: GoDaddy setup complete.');
            console.log(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            console.log(
              verified
                ? '✓ Credentials verified via GoDaddy API.'
                : '⚠ Credentials written but live verification did not confirm.',
            );
          }
          return verified ? 0 : 1;
        },
      },
    },
  });
}

export function registerGdTopLevelAlias(registry: CommandRegistry): void {
  const domain = registry.resolveDomain('registrars/godaddy');
  if (!domain) return;
  registry.register({
    name: 'gd',
    aliases: [],
    commands: domain.commands,
  });
}
