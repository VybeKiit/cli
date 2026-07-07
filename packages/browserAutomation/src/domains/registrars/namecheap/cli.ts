import { printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import { baseVerbContext } from '@vybekiit/browser-automation/cli/verbContext';
import { writeEnvBlock } from '@vybekiit/browser-automation/core/writeEnvBlock';
import { verifyNcCredentialsViaApi } from './api/verify';
import { ncSetupEnvBlock } from './types';
import { runNcSetup, standbyLogin } from './verbs/standbyLogin';

const parseSandboxFlag = (args: string[]): boolean => args.includes('--sandbox');

/**
 * Register Namecheap Domain.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerNamecheapDomain(registry);
 */
export const registerNamecheapDomain = (registry: CommandRegistry): void => {
  registry.register({
    name: 'registrars/namecheap',
    aliases: [],
    commands: {
      standby: {
        description: 'Wait for Namecheap dashboard after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin(baseVerbContext(flags));
          if (flags.json) {
            printJson({ ok: result.ready, ...result });
          } else if (result.ready) {
            printLine(`OK: Namecheap ready at ${result.url}`);
          } else {
            printLine('Timed out waiting for Namecheap sign-in.');
          }
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
            printLine('OK: Namecheap setup complete.');
            printLine(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            printLine(
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
};

/**
 * Register Nc Top Level Alias.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerNcTopLevelAlias(registry);
 */
export const registerNcTopLevelAlias = (registry: CommandRegistry): void => {
  const domain = registry.resolveDomain('registrars/namecheap');
  if (!domain) {
    return;
  }
  registry.register({
    name: 'nc',
    aliases: [],
    commands: domain.commands,
  });
};
