import { spawnSync } from 'node:child_process';
import { printError, printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import { ensureCli } from '@vybekiit/browser-automation/core/ensureCli';

/**
 * Register a CLI-native provider (Railway, Vercel, …) whose credentials live in the tool's
 * own store per ADR-0001 — not in `.env`. There is no token to scrape: `setup` ensures the
 * CLI (auto-installs via `doctor --ensure`), confirms sign-in with the tool's `whoami`
 * probe, and reports readiness. This is the CLI-first path taken to its logical end: when the
 * CLI fully owns auth, browser automation is not just a fallback — it's unnecessary.
 */
export type CliAuthProviderSpec = {
  /** Registry domain name, e.g. `infra/railway`. */
  domain: string;
  /** Short aliases, e.g. `['railway']`. */
  aliases: string[];
  /** Executable ensured via doctor, e.g. `railway`. */
  tool: string;
  /** `whoami`-style probe args that exit 0 only when signed in. */
  whoamiArgs: readonly string[];
  /** One-time login command shown when not signed in. */
  loginHint: string;
  /** Human label for messages. */
  label: string;
};

const isSignedIn = (tool: string, args: readonly string[]): boolean =>
  spawnSync(tool, [...args], { stdio: 'ignore' }).status === 0;

/**
 * Register Cli Auth Provider.
 *
 * @param registry - Command registry receiving domain commands.
 * @param spec - Input value for spec.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerCliAuthProvider(registry, spec);
 */
export const registerCliAuthProvider = (
  registry: CommandRegistry,
  spec: CliAuthProviderSpec,
): void => {
  registry.register({
    name: spec.domain,
    aliases: spec.aliases,
    commands: {
      setup: {
        description: `Ensure the ${spec.label} CLI is installed and signed in (auth lives in the CLI store)`,
        run: async ({ flags }) => {
          const cli = ensureCli(spec.tool, {});
          if (!cli.installed) {
            const message = `${spec.label} CLI could not be installed. ${cli.missingRequirement ? `Install ${cli.missingRequirement} first.` : ''}`;
            if (flags.json) printJson({ ok: false, tool: spec.tool, error: message.trim() });
            else printError(message.trim(), false);
            return 1;
          }
          const signedIn = isSignedIn(spec.tool, spec.whoamiArgs);
          if (flags.json) {
            printJson({
              ok: signedIn,
              tool: spec.tool,
              installed: cli.installed,
              signedIn,
              ...(signedIn ? {} : { loginHint: spec.loginHint }),
            });
          } else if (signedIn) {
            printLine(`OK: ${spec.label} CLI ready and signed in.`);
          } else {
            printLine(
              `→ ${spec.label} CLI installed. One-time sign-in: run \`${spec.loginHint}\`.`,
            );
          }
          return signedIn ? 0 : 1;
        },
      },
    },
  });
};

/**
 * Register Railway + Vercel — both CLI-native hosting providers.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerRailwayDomain(registry);
 */
export const registerRailwayDomain = (registry: CommandRegistry): void => {
  registerCliAuthProvider(registry, {
    domain: 'infra/railway',
    aliases: ['railway'],
    tool: 'railway',
    whoamiArgs: ['whoami'],
    loginHint: 'railway login',
    label: 'Railway',
  });
};

/**
 * Register Vercel Domain.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerVercelDomain(registry);
 */
export const registerVercelDomain = (registry: CommandRegistry): void => {
  registerCliAuthProvider(registry, {
    domain: 'infra/vercel',
    aliases: ['vercel'],
    tool: 'vercel',
    whoamiArgs: ['whoami'],
    loginHint: 'vercel login',
    label: 'Vercel',
  });
};
