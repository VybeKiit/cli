import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { baseVerbContext } from '@vybekiit/browserAutomation/cli/verbContext';
import { cfEnvBlock, type CfSetupResult } from '@vybekiit/browserAutomation/domains/infra/types';
import { connectToCfChrome } from './connect';
import { waitForCfAuthenticated } from './dashboard/waitForAuthenticated';

export async function standbyLogin(
  ctx: ReturnType<typeof baseVerbContext>,
): Promise<{ ready: boolean; url?: string }> {
  const session = await connectToCfChrome(ctx, { waitForAuth: false });
  try {
    const page = await waitForCfAuthenticated(
      session.page,
      ctx.log ?? console,
      session.context,
    );
    return { ready: true, url: page.url() };
  } catch {
    return { ready: false };
  } finally {
    await session.dispose();
  }
}

/**
 * Run Cloudflare API token setup: create scoped token, return .env block.
 *
 * Stub — full implementation needs Cloudflare Console DOM probes.
 */
export async function runCfSetup(
  ctx: ReturnType<typeof baseVerbContext>,
  _params: { tokenName?: string; scopes?: string },
): Promise<CfSetupResult> {
  const session = await connectToCfChrome(ctx, { waitForAuth: true });
  try {
    // TODO: navigate to My Profile -> API Tokens
    // TODO: create token with scoped permissions (Workers, Pages, R2)
    // TODO: scrape token value (shown once)
    // TODO: read account ID from URL or page
    throw new Error(
      'Cloudflare token setup automation is not yet implemented. Use wrangler login and copy the token manually.',
    );
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
        description:
          'Create Cloudflare API token with scoped permissions (\u2014token-name \u2014scopes)',
        run: async ({ args, flags }) => {
          const params: Record<string, string> = {};
          for (const arg of args) {
            if (arg.startsWith('--token-name=')) params.tokenName = arg.slice('--token-name='.length);
            if (arg.startsWith('--scopes=')) params.scopes = arg.slice('--scopes='.length);
          }
          const result = await runCfSetup(baseVerbContext(flags), params);
          const env = cfEnvBlock(result);
          if (flags.json) {
            printJson({ ok: true, env, tokenId: result.tokenId });
          } else {
            console.log('OK: Cloudflare setup complete.');
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
