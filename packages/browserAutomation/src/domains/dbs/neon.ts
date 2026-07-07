import { spawnSync } from 'node:child_process';

/**
 * CLI-first Neon connection-string retrieval via `neonctl` (ensured with
 * `doctor --ensure neonctl`). Neon has no browser step for reading a connection string —
 * the CLI resolves it headlessly once the builder has run `neonctl auth`.
 */

type NeonProject = {
  id: string;
  name: string;
};

/**
 * List the signed-in user's Neon projects (empty when the CLI can't answer).
 *
 * @returns Resolved list of provider resources.
 * @example
 * const result = listNeonProjects();
 */
export const listNeonProjects = (): NeonProject[] => {
  const result = spawnSync('neonctl', ['projects', 'list', '--output', 'json'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) return [];
  try {
    const stdout = typeof result.stdout === 'string' ? result.stdout : '';
    const parsed = JSON.parse(stdout) as { projects?: NeonProject[] } | NeonProject[];
    if (Array.isArray(parsed)) return parsed;
    return parsed.projects === undefined ? [] : parsed.projects;
  } catch {
    return [];
  }
};

/**
 * Read a pooled Postgres connection string for a project via the CLI.
 *
 * @param projectId - Provider project id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = readNeonConnectionString('project-id');
 */
export const readNeonConnectionString = (projectId: string): string | null => {
  const result = spawnSync(
    'neonctl',
    ['connection-string', '--project-id', projectId, '--pooled'],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) return null;
  const out = typeof result.stdout === 'string' ? result.stdout.trim() : '';
  return out.startsWith('postgres') ? out : null;
};
