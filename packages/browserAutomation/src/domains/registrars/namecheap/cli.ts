import type { CommandRegistry } from '../../../cli/registry';
import { baseVerbContext } from '../../../cli/verbContext';
import { printJson } from '../../../cli/output';
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
          await verifyNcCredentialsViaApi(result);
          const env = ncSetupEnvBlock(result);
          if (flags.json) {
            printJson({
              ok: true,
              env,
              sandbox: result.sandbox,
              reusedExisting: result.reusedExisting,
            });
          } else {
            console.log('OK: Namecheap API credentials verified.');
            console.log('Write these to .env:');
            for (const [key, value] of Object.entries(env)) {
              console.log(`${key}=${value}`);
            }
          }
          return 0;
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
