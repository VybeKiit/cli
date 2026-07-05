import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { baseVerbContext } from '@vybekiit/browserAutomation/cli/verbContext';
import { supabaseEnvBlock, type SupabaseSetupResult } from '@vybekiit/browserAutomation/domains/dbs/types';
import { connectToSupabaseChrome } from './connect';
import { waitForSupabaseAuthenticated } from './dashboard/waitForAuthenticated';

export async function standbyLogin(
  ctx: ReturnType<typeof baseVerbContext>,
): Promise<{ ready: boolean; url?: string }> {
  const session = await connectToSupabaseChrome(ctx, { waitForAuth: false });
  try {
    const page = await waitForSupabaseAuthenticated(
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
 * Run Supabase setup: create project, extract keys, return .env block.
 *
 * Stub — full implementation needs Supabase Console DOM probes.
 */
export async function runSupabaseSetup(
  ctx: ReturnType<typeof baseVerbContext>,
  _params: { orgSlug?: string; projectName?: string; region?: string },
): Promise<SupabaseSetupResult> {
  const session = await connectToSupabaseChrome(ctx, { waitForAuth: true });
  try {
    // TODO: navigate to new-project wizard, fill name, select region, create
    // TODO: poll until project is healthy
    // TODO: read Settings -> API for URL/anon/service_role
    // TODO: return credentials
    throw new Error('Supabase setup automation is not yet implemented. Use the Supabase MCP server or manual dashboard.');
  } finally {
    await session.dispose();
  }
}

export function registerSupabaseDomain(registry: CommandRegistry): void {
  registry.register({
    name: 'dbs/supabase',
    aliases: ['db'],
    commands: {
      standby: {
        description: 'Wait for Supabase dashboard after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin(baseVerbContext(flags));
          if (flags.json) printJson({ ok: result.ready, ...result });
          else if (result.ready) console.log(`OK: dashboard ready at ${result.url}`);
          else console.log('Timed out waiting for Supabase sign-in.');
          return result.ready ? 0 : 1;
        },
      },
      setup: {
        description: 'Create Supabase project and extract API keys (\u2014project-name \u2014region \u2014org)',
        run: async ({ args, flags }) => {
          const params: Record<string, string> = {};
          for (const arg of args) {
            if (arg.startsWith('--project-name=')) params.projectName = arg.slice('--project-name='.length);
            if (arg.startsWith('--region=')) params.region = arg.slice('--region='.length);
            if (arg.startsWith('--org=')) params.orgSlug = arg.slice('--org='.length);
          }
          const result = await runSupabaseSetup(baseVerbContext(flags), params);
          const env = supabaseEnvBlock(result);
          if (flags.json) {
            printJson({ ok: true, env, projectRef: result.projectRef });
          } else {
            console.log('OK: Supabase setup complete.');
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
