import { spawnSync } from 'node:child_process';
import type { SupabaseSetupResult } from './types';

/**
 * CLI-first Supabase key retrieval via the `supabase` CLI (ensured with
 * `doctor --ensure supabase`). The CLI surfaces the anon + service_role keys headlessly, so
 * for an existing project we never need the browser. Browser automation is the fallback only
 * when the CLI can't resolve the project.
 */

interface SupabaseProject {
  ref: string;
  name: string;
}

interface SupabaseApiKey {
  name: string;
  api_key: string;
}

function runSupabaseJson<T>(args: readonly string[]): T | null {
  const result = spawnSync('supabase', [...args, '--output', 'json'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout ?? '') as T;
  } catch {
    return null;
  }
}

/** List the signed-in user's Supabase projects (empty when not signed in). */
export function listSupabaseProjects(): SupabaseProject[] {
  return runSupabaseJson<SupabaseProject[]>(['projects', 'list']) ?? [];
}

/**
 * Resolve a project's URL + anon/service_role keys via the CLI. Returns null when the CLI
 * can't provide them (missing project, not signed in) so the caller can fall back to browser.
 */
export function readSupabaseKeysViaCli(projectRef: string): SupabaseSetupResult | null {
  const keys = runSupabaseJson<SupabaseApiKey[]>([
    'projects',
    'api-keys',
    '--project-ref',
    projectRef,
  ]);
  if (!keys) return null;

  const anon = keys.find((k) => k.name === 'anon')?.api_key;
  const serviceRole = keys.find((k) => k.name === 'service_role')?.api_key;
  if (!(anon && serviceRole)) return null;

  return {
    projectRef,
    projectUrl: `https://${projectRef}.supabase.co`,
    anonKey: anon,
    serviceRoleKey: serviceRole,
  };
}
