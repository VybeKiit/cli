import type { CommandRegistry } from '../../../cli/registry';
import { printJson } from '../../../cli/output';
import {
  parseSetupArgs,
  requireNonInteractive,
  type LsSetupCliArgs,
} from '../../../cli/flags';
import { promptLsSetup } from '../../../cli/wizard';
import { runLsSetup, standbyLogin } from './index';

export function registerLsDomain(registry: CommandRegistry): void {
  registry.register({
    name: 'payments/ls',
    aliases: [],
    commands: {
      standby: {
        description: 'Wait for Lemon Squeezy dashboard after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin({});
          if (flags.json) printJson({ ok: result.ready, ...result });
          else if (result.ready) console.log(`OK: dashboard ready at ${result.url}`);
          else console.log('Timed out waiting for Lemon Squeezy dashboard sign-in.');
          return result.ready ? 0 : 1;
        },
      },
      setup: {
        description: 'Provision LS product, API key, and webhook',
        run: async ({ args, flags }) => {
          const partial = parseSetupArgs(args);
          const missing: string[] = [];
          if (!partial.name) missing.push('name');
          if (partial.priceCents === undefined) missing.push('price-cents');
          if (!partial.mode) missing.push('mode');
          if (!partial.webhookUrl) missing.push('webhook-url');
          requireNonInteractive(flags, missing);

          let params: LsSetupCliArgs;
          if (missing.length > 0) params = await promptLsSetup(partial);
          else params = partial as LsSetupCliArgs;

          const result = await runLsSetup({}, params);
          if (flags.json) printJson({ ok: true, ...result });
          else console.log('OK: Lemon Squeezy setup complete.');
          return 0;
        },
      },
    },
  });
}

/** Top-level `ls` alias routes into payments/ls commands. */
export function registerLsTopLevelAlias(registry: CommandRegistry): void {
  const lsDomain = registry.resolveDomain('payments/ls');
  if (!lsDomain) return;
  registry.register({
    name: 'ls',
    aliases: [],
    commands: lsDomain.commands,
  });
}
