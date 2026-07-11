import { type PageResult, paginate, scoreQuery } from './uiCatalog';

/** Slim doctor toolchain entry for discovery (does not run doctor). */
export type DoctorToolEntry = {
  readonly name: string;
  readonly purpose: string;
  readonly category: 'agent' | 'hosting' | 'data' | 'cloud' | 'native';
};

/**
 * Declared doctor tools agents may ensure via `vybekiit doctor --ensure <name>`.
 * Static snapshot of the CLI toolchain surface (read-only discovery).
 */
export const DOCTOR_TOOLS: readonly DoctorToolEntry[] = [
  { name: 'claude', purpose: 'Claude Code agent CLI', category: 'agent' },
  { name: 'codex', purpose: 'Codex agent CLI', category: 'agent' },
  { name: 'skills', purpose: 'skills CLI for platform skill lock updates', category: 'agent' },
  { name: 'gh', purpose: 'download starter files and sign in to GitHub', category: 'cloud' },
  { name: 'wrangler', purpose: 'put the app online on Cloudflare', category: 'hosting' },
  { name: 'vercel', purpose: 'put the app online on Vercel', category: 'hosting' },
  { name: 'railway', purpose: 'hosting + coupled database on Railway', category: 'hosting' },
  { name: 'supabase', purpose: 'create and manage the default database', category: 'data' },
  { name: 'neonctl', purpose: 'create and manage Neon database projects', category: 'data' },
  { name: 'atlas', purpose: 'create and manage MongoDB Atlas', category: 'data' },
  { name: 'aws', purpose: 'create and manage AWS-backed services', category: 'cloud' },
  { name: 'firebase', purpose: 'Firebase project tools', category: 'data' },
  { name: 'node', purpose: 'Node.js runtime', category: 'native' },
  { name: 'pnpm', purpose: 'package manager used by the kit monorepo', category: 'native' },
] as const;

/** Scored doctor tool row. */
export type SlimDoctorTool = DoctorToolEntry & { readonly score: number };

/**
 * Fuzzy-search doctor tools with cursor pagination.
 *
 * @param query - Free-text query (empty = list all).
 * @param options - Optional limit and cursor.
 * @returns Page of doctor tool rows.
 * @example
 * searchDoctorTools('database', { limit: 5 });
 */
export const searchDoctorTools = (
  query: string,
  options?: { readonly limit?: number; readonly cursor?: string },
): PageResult<SlimDoctorTool> => {
  const trimmed = query.trim();
  const ranked = DOCTOR_TOOLS.map((entry) => {
    const score =
      trimmed.length === 0 ? 1 : scoreQuery(trimmed, [entry.name, entry.purpose, entry.category]);
    return { ...entry, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return paginate(ranked, options);
};
