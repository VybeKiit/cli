import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { baseVerbContext } from '@vybekiit/browserAutomation/cli/verbContext';
import { ensureCli } from '@vybekiit/browserAutomation/core/ensureCli';
import { writeEnvBlock } from '@vybekiit/browserAutomation/core/writeEnvBlock';
import { type CfSetupResult, cfEnvBlock } from '@vybekiit/browserAutomation/domains/infra/types';
import { connectToCfChrome } from './connect';
import { createApiToken } from './dashboard/createApiToken';
import { waitForCfAuthenticated } from './dashboard/waitForAuthenticated';
import { verifyCfToken } from './verify';
import { readAccountIdFromWrangler } from './wrangler';

export async function standbyLogin(
  ctx: ReturnType<typeof baseVerbContext>,
): Promise<{ ready: boolean; url?: string }> {
  const session = await connectToCfChrome(ctx, { waitForAuth: false });
  try {
    const page = await waitForCfAuthenticated(session.page, ctx.log ?? console, session.context);
    return { ready: true, url: page.url() };
  } catch {
    return { ready: false };
  } finally {
    await session.dispose();
  }
}

function shortName(): string {
  return `vybekiit-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Run Cloudflare API token setup: CLI-first preflight (ensure wrangler), read the account
 * id via wrangler, then mint a scoped token through the dashboard (browser fallback —
 * wrangler cannot create arbitrary scoped tokens). The token never returns to the agent as
 * text; it is written to `.env` by the caller.
 */
export async function runCfSetup(
  ctx: ReturnType<typeof baseVerbContext>,
  params: { tokenName?: string },
): Promise<CfSetupResult> {
  const log = ctx.log ?? console;

  // CLI-first: ensure wrangler is installed (auto-install if missing) via doctor.
  const wrangler = ensureCli('wrangler', { log });
  if (!wrangler.installed) {
    log.warn('[cf] wrangler is not installed; proceeding with browser-only account detection.');
  }
  const accountIdFromCli = wrangler.installed ? readAccountIdFromWrangler() : null;

  const name = params.tokenName ?? shortName();
  const session = await connectToCfChrome(ctx, { waitForAuth: true });
  try {
    const minted = await createApiToken(session.page, name, accountIdFromCli ?? undefined);
    return {
      token: minted.token,
      tokenId: name,
      accountId: minted.accountId || accountIdFromCli || '',
      name,
    };
  } finally {
    await session.dispose();
  }
}

export function registerCfDomain(registry: CommandRegistry): void {
  registry.register({
    name: 'infra/cloudflare',
    aliases: ['cf'],
    commands: {
      standby: {
        description: 'Wait for Cloudflare dashboard after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin(baseVerbContext(flags));
          if (flags.json) printJson({ ok: result.ready, ...result });
          else if (result.ready) console.log(`OK: dashboard ready at ${result.url}`);
          else console.log('Timed out waiting for Cloudflare sign-in.');
          return result.ready ? 0 : 1;
        },
      },
      setup: {
        description: 'Create a Cloudflare API token with full permissions (--token-name)',
        run: async ({ args, flags }) => {
          const params: { tokenName?: string } = {};
          for (const arg of args) {
            if (arg.startsWith('--token-name=')) {
              params.tokenName = arg.slice('--token-name='.length);
            }
          }
          const result = await runCfSetup(baseVerbContext(flags), params);

          // Live self-verification (token value stays in-process).
          const verified = await verifyCfToken(result.accountId, result.token);

          const env = cfEnvBlock(result);
          const written = await writeEnvBlock({ ...env });
          if (flags.json) {
            // Key-guarded: never emit the token value to the agent transcript.
            printJson({
              ok: verified.ok,
              tokenId: result.tokenId,
              keysWritten: written.keysWritten,
              verified: verified.ok,
              ...(verified.status ? { status: verified.status } : {}),
            });
          } else {
            console.log('OK: Cloudflare setup complete.');
            console.log(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            console.log(
              verified.ok
                ? '✓ Token verified active via Cloudflare API.'
                : '⚠ Token written but live verification did not confirm active status.',
            );
          }
          return verified.ok ? 0 : 1;
        },
      },
    },
  });
}
