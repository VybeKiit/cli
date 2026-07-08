import { spawnSync } from 'node:child_process';
import { printError, printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import {
  GITHUB_USER_URL,
  RESEND_DOMAINS_URL,
  SENTRY_API_URL,
} from '@vybekiit/browser-automation/core/constants';
import { ensureCli } from '@vybekiit/browser-automation/core/ensureCli';
import { writeEnvBlock } from '@vybekiit/browser-automation/core/writeEnvBlock';

/**
 * Miscellaneous providers that don't fit infra/dbs/ai:
 * - GitHub — CLI-first: after `doctor --ensure gh`, read the token from the gh store with
 *   `gh auth token` (no browser, no paste). Verified with `gh api /user`.
 * - Resend, Sentry — no CLI to mint a key, so browser-fallback paste: the key is created in
 *   the console, passed via `--api-key`, verified live, and written to `.env`.
 * In every case the value is persisted to disk and never returned to the agent transcript.
 */

/** Read the GitHub token from the gh CLI store (empty when not signed in). */
const readGithubTokenFromCli = (): string | null => {
  const result = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const token = typeof result.stdout === 'string' ? result.stdout.trim() : '';
  return token.length > 0 ? token : null;
};

const verifyGithub = async (token: string): Promise<boolean> => {
  try {
    const res = await fetch(GITHUB_USER_URL, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'vybekiit' },
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Register Github Domain.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerGithubDomain(registry);
 */
export const registerGithubDomain = (registry: CommandRegistry): void => {
  registry.register({
    name: 'misc/github',
    aliases: ['github'],
    commands: {
      setup: {
        description: 'Read a GitHub token from the gh CLI into .env (CLI-first, no paste)',
        run: async ({ flags }) => {
          const cli = ensureCli('gh', {});
          if (!cli.installed) {
            const message = 'gh CLI could not be installed.';
            if (flags.json) printJson({ ok: false, tool: 'gh', error: message });
            else printError(message, false);
            return 1;
          }
          const token = readGithubTokenFromCli();
          if (!token) {
            const message = 'Not signed in to GitHub. Run `gh auth login`, then re-run.';
            if (flags.json) printJson({ ok: false, loginHint: 'gh auth login', error: message });
            else printError(message, false);
            return 1;
          }
          const verified = await verifyGithub(token);
          const written = await writeEnvBlock({ GITHUB_TOKEN: token });
          if (flags.json) {
            printJson({ ok: verified, keysWritten: written.keysWritten, verified });
          } else {
            printLine('OK: GitHub setup complete.');
            printLine(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            printLine(verified ? '✓ Token verified via GitHub API.' : '⚠ Verification failed.');
          }
          return verified ? 0 : 1;
        },
      },
    },
  });
};

type PasteProviderSpec = {
  domain: string;
  aliases: string[];
  label: string;
  envKey: string;
  verify: (apiKey: string) => Promise<boolean>;
};

const verifyResend = async (apiKey: string): Promise<boolean> => {
  try {
    // Resend has no read-only whoami; listing domains is the lightest authorized call.
    const res = await fetch(RESEND_DOMAINS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.status !== 401 && res.status !== 403;
  } catch {
    return false;
  }
};

const verifySentry = async (apiKey: string): Promise<boolean> => {
  try {
    const res = await fetch(SENTRY_API_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.status !== 401 && res.status !== 403;
  } catch {
    return false;
  }
};

const registerPasteProvider = (registry: CommandRegistry, spec: PasteProviderSpec): void => {
  registry.register({
    name: spec.domain,
    aliases: spec.aliases,
    commands: {
      setup: {
        description: `Verify + persist a ${spec.label} API key to .env (--api-key)`,
        run: async ({ args, flags }) => {
          let apiKey: string | undefined;
          for (const arg of args) {
            if (arg.startsWith('--api-key=')) apiKey = arg.slice('--api-key='.length);
          }
          if (!apiKey) {
            const message = `${spec.label} has no CLI to mint a key. Create one in the console and pass --api-key=<key>.`;
            if (flags.json) printJson({ ok: false, error: message });
            else printError(message, false);
            return 1;
          }
          const verified = await spec.verify(apiKey);
          const written = await writeEnvBlock({ [spec.envKey]: apiKey });
          if (flags.json) {
            printJson({ ok: verified, keysWritten: written.keysWritten, verified });
          } else {
            printLine(`OK: ${spec.label} setup complete.`);
            printLine(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            printLine(
              verified
                ? `✓ Key verified against the ${spec.label} API.`
                : '⚠ Key written but live verification failed.',
            );
          }
          return verified ? 0 : 1;
        },
      },
    },
  });
};

/**
 * Register Resend Domain.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerResendDomain(registry);
 */
export const registerResendDomain = (registry: CommandRegistry): void => {
  registerPasteProvider(registry, {
    domain: 'misc/resend',
    aliases: ['resend'],
    label: 'Resend',
    envKey: 'RESEND_API_KEY',
    verify: verifyResend,
  });
};

/**
 * Register Sentry Domain.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerSentryDomain(registry);
 */
export const registerSentryDomain = (registry: CommandRegistry): void => {
  registerPasteProvider(registry, {
    domain: 'misc/sentry',
    aliases: ['sentry'],
    label: 'Sentry',
    envKey: 'SENTRY_AUTH_TOKEN',
    verify: verifySentry,
  });
};
