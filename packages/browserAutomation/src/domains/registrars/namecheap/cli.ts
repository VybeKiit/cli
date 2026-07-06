import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { baseVerbContext } from '@vybekiit/browserAutomation/cli/verbContext';
import { writeEnvBlock } from '@vybekiit/browserAutomation/core/writeEnvBlock';
import { ncSetupEnvBlock, verifyNcCredentialsViaApi } from './api/verify';
import { runNcSetup, standbyLogin } from './verbs/standbyLogin';

function parseSandboxFlag(args: string[]): boolean {
  return args.includes('--sandbox');
}

export function registerNamecheapDomain(registry: CommandRegistry): void {
  registry.register({
    name: 'registrars/namecheap',
    aliases: [],
    commands: {
      standby: {
        description: 'Wait for Namecheap dashboard after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin(baseVerbContext(flags));
          if (flags.json) printJson({ ok: result.ready, ...result });
          else if (result.ready) console.log(`OK: Namecheap ready at ${result.url}`);
          else console.log('Timed out waiting for Namecheap sign-in.');
          return result.ready ? 0 : 1;
        },
      },
      setup: {
        description: 'Enable Namecheap API access, whitelist IP, and verify credentials',
        run: async ({ args, flags }) => {
          const sandbox = parseSandboxFlag(args);
          const result = await runNcSetup(baseVerbContext(flags), { sandbox });

          // Persist first (key-guarded), then verify — mirrors the CF/GoDaddy setup contract so
          // the builder never has to copy a secret and the agent never sees the key value.
          const env = ncSetupEnvBlock(result);
          const written = await writeEnvBlock({ ...env });

          let verified = true;
          try {
            await verifyNcCredentialsViaApi(result);
          } catch {
            verified = false;
          }

          if (flags.json) {
            printJson({
              ok: verified,
              keysWritten: written.keysWritten,
              sandbox: result.sandbox,
              reusedExisting: result.reusedExisting,
              verified,
            });
          } else {
            console.log('OK: Namecheap setup complete.');
            console.log(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            console.log(
              verified
                ? '✓ Credentials verified via Namecheap API.'
                : '⚠ Credentials written but live verification did not confirm.',
            );
          }
          return verified ? 0 : 1;
        },
      },
    },
  });
}

export function registerNcTopLevelAlias(registry: CommandRegistry): void {
  const domain = registry.resolveDomain('registrars/namecheap');
  if (!domain) return;
  registry.register({
    name: 'nc',
    aliases: [],
    commands: domain.commands,
  });
}
