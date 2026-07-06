import { spawnSync } from 'node:child_process';

/**
 * CLI-first Neon connection-string retrieval via `neonctl` (ensured with
 * `doctor --ensure neonctl`). Neon has no browser step for reading a connection string —
 * the CLI resolves it headlessly once the builder has run `neonctl auth`.
 */

interface NeonProject {
  id: string;
  name: string;
}

/** List the signed-in user's Neon projects (empty when the CLI can't answer). */
export function listNeonProjects(): NeonProject[] {
  const result = spawnSync('neonctl', ['projects', 'list', '--output', 'json'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) return [];
  try {
    const parsed = JSON.parse(result.stdout ?? '') as { projects?: NeonProject[] } | NeonProject[];
    return Array.isArray(parsed) ? parsed : (parsed.projects ?? []);
  } catch {
    return [];
  }
}

/** Read a pooled Postgres connection string for a project via the CLI. */
export function readNeonConnectionString(projectId: string): string | null {
  const result = spawnSync(
    'neonctl',
    ['connection-string', '--project-id', projectId, '--pooled'],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) return null;
  const out = (result.stdout ?? '').trim();
  return out.startsWith('postgres') ? out : null;
}
