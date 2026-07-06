import { spawnSync } from 'node:child_process';
import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { ensureCli } from '@vybekiit/browserAutomation/core/ensureCli';

/**
 * Register a CLI-native provider (Railway, Vercel, …) whose credentials live in the tool's
 * own store per ADR-0001 — not in `.env`. There is no token to scrape: `setup` ensures the
 * CLI (auto-installs via `doctor --ensure`), confirms sign-in with the tool's `whoami`
 * probe, and reports readiness. This is the CLI-first path taken to its logical end: when the
 * CLI fully owns auth, browser automation is not just a fallback — it's unnecessary.
 */
export interface CliAuthProviderSpec {
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
}

function isSignedIn(tool: string, args: readonly string[]): boolean {
  return spawnSync(tool, [...args], { stdio: 'ignore' }).status === 0;
}

export function registerCliAuthProvider(
  registry: CommandRegistry,
  spec: CliAuthProviderSpec,
): void {
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
            else console.error(message.trim());
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
            console.log(`OK: ${spec.label} CLI ready and signed in.`);
          } else {
            console.log(
              `→ ${spec.label} CLI installed. One-time sign-in: run \`${spec.loginHint}\`.`,
            );
          }
          return signedIn ? 0 : 1;
        },
      },
    },
  });
}

/** Register Railway + Vercel — both CLI-native hosting providers. */
export function registerRailwayDomain(registry: CommandRegistry): void {
  registerCliAuthProvider(registry, {
    domain: 'infra/railway',
    aliases: ['railway'],
    tool: 'railway',
    whoamiArgs: ['whoami'],
    loginHint: 'railway login',
    label: 'Railway',
  });
}

export function registerVercelDomain(registry: CommandRegistry): void {
  registerCliAuthProvider(registry, {
    domain: 'infra/vercel',
    aliases: ['vercel'],
    tool: 'vercel',
    whoamiArgs: ['whoami'],
    loginHint: 'vercel login',
    label: 'Vercel',
  });
}
