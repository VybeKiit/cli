import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { baseVerbContext } from '@vybekiit/browserAutomation/cli/verbContext';
import { ensureCli } from '@vybekiit/browserAutomation/core/ensureCli';
import { writeEnvBlock } from '@vybekiit/browserAutomation/core/writeEnvBlock';
import {
  type SupabaseSetupResult,
  supabaseEnvBlock,
} from '@vybekiit/browserAutomation/domains/dbs/types';
import { connectToSupabaseChrome } from './connect';
import { waitForSupabaseAuthenticated } from './dashboard/waitForAuthenticated';
import { listSupabaseProjects, readSupabaseKeysViaCli } from './supabase';
import { verifySupabaseKeys } from './verify';

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
 * Resolve Supabase project URL + keys, CLI-first.
 *
 * 1. Ensure the `supabase` CLI (auto-install via doctor).
 * 2. Resolve the project ref (explicit `--project-ref`, else the sole project the CLI lists).
 * 3. Read anon + service_role keys headlessly via the CLI — no browser needed.
 *
 * Returns null only when the CLI can't surface the keys; the caller then falls back to the
 * browser flow. Project *creation* (new-project wizard) remains a browser/MCP concern.
 */
export function resolveSupabaseViaCli(
  projectRef: string | undefined,
  log: Pick<Console, 'log' | 'warn'>,
): SupabaseSetupResult | null {
  const cli = ensureCli('supabase', { log });
  if (!cli.installed) {
    log.warn('[supabase] CLI not available; falling back to browser.');
    return null;
  }

  let ref = projectRef;
  if (!ref) {
    const projects = listSupabaseProjects();
    if (projects.length === 1) ref = projects[0]?.ref;
    else if (projects.length > 1) {
      log.warn('[supabase] multiple projects found; pass --project-ref=<ref> to disambiguate.');
      return null;
    }
  }
  if (!ref) return null;

  return readSupabaseKeysViaCli(ref);
}

/**
 * Run Supabase setup: CLI-first key retrieval, browser fallback for project creation /
 * console-only keys. Returns credentials; the caller writes them to `.env`.
 */
export async function runSupabaseSetup(
  ctx: ReturnType<typeof baseVerbContext>,
  params: { orgSlug?: string; projectName?: string; region?: string; projectRef?: string },
): Promise<SupabaseSetupResult> {
  const log = ctx.log ?? console;

  const viaCli = resolveSupabaseViaCli(params.projectRef, log);
  if (viaCli) {
    log.log(`[supabase] resolved keys for project ${viaCli.projectRef} via CLI.`);
    return viaCli;
  }

  // Browser fallback: builder signs in; we read Settings → API for an existing project.
  const session = await connectToSupabaseChrome(ctx, { waitForAuth: true });
  try {
    throw new Error(
      'Supabase keys could not be resolved via the CLI. Sign in with `supabase login` and pass --project-ref=<ref>, or create the project in the dashboard first.',
    );
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
        description:
          'Resolve Supabase keys into .env, CLI-first (--project-ref --project-name --region --org)',
        run: async ({ args, flags }) => {
          const params: Record<string, string> = {};
          for (const arg of args) {
            if (arg.startsWith('--project-name='))
              params.projectName = arg.slice('--project-name='.length);
            if (arg.startsWith('--region=')) params.region = arg.slice('--region='.length);
            if (arg.startsWith('--org=')) params.orgSlug = arg.slice('--org='.length);
            if (arg.startsWith('--project-ref='))
              params.projectRef = arg.slice('--project-ref='.length);
          }
          const result = await runSupabaseSetup(baseVerbContext(flags), params);

          const verified = await verifySupabaseKeys(result.projectUrl, result.anonKey);

          const env = supabaseEnvBlock(result);
          const written = await writeEnvBlock({ ...env });
          if (flags.json) {
            printJson({
              ok: verified.ok,
              projectRef: result.projectRef,
              keysWritten: written.keysWritten,
              verified: verified.ok,
            });
          } else {
            console.log('OK: Supabase setup complete.');
            console.log(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            console.log(
              verified.ok
                ? '✓ Keys verified against the Supabase REST endpoint.'
                : '⚠ Keys written but live verification did not confirm access.',
            );
          }
          return verified.ok ? 0 : 1;
        },
      },
    },
  });
}
