import { type PageResult, paginate, scoreQuery } from './uiCatalog';

/** One CLI verb agents may discover via MCP. */
export type CliCommandEntry = {
  readonly name: string;
  readonly usage: string;
  readonly summary: string;
  readonly group: 'buyer' | 'create' | 'agent' | 'backend' | 'ops';
};

/**
 * Static CLI command catalog (mirrors `vybekiit help --all` agent surface).
 * Kept here so MCP never needs to spawn the CLI just to list verbs.
 */
export const CLI_COMMANDS: readonly CliCommandEntry[] = [
  {
    name: 'setup',
    usage: 'vybekiit setup',
    summary: 'Welcome + install/check the tools the app needs',
    group: 'buyer',
  },
  {
    name: 'doctor',
    usage: 'vybekiit doctor [--ensure <tool>] [--json]',
    summary: 'Full toolchain pass (agents, gh, cloud CLIs, skills, MCP wire)',
    group: 'buyer',
  },
  {
    name: 'create',
    usage: 'vybekiit create app --web|--mobile|--extension [directory]',
    summary: 'Scaffold a new app surface from a template',
    group: 'create',
  },
  {
    name: 'init',
    usage: 'vybekiit init [directory]',
    summary: 'Initialize kit files in an existing project',
    group: 'create',
  },
  {
    name: 'local-dev',
    usage: 'vybekiit local-dev',
    summary: 'Open the local development console sidecar',
    group: 'ops',
  },
  {
    name: 'sync-agent-layer',
    usage: 'vybekiit sync-agent-layer [template]',
    summary: 'Refresh buyer agent layer files from the kit',
    group: 'agent',
  },
  {
    name: 'update-kit',
    usage: 'vybekiit update-kit',
    summary: 'Plan a safe kit update across the three channels',
    group: 'agent',
  },
  {
    name: 'check-goals',
    usage: 'vybekiit check-goals [template]',
    summary: 'Validate goal-index routing against skill files',
    group: 'agent',
  },
  {
    name: 'check-agent-layer',
    usage: 'vybekiit check-agent-layer [template]',
    summary: 'Validate agent-layer structure and contract files',
    group: 'agent',
  },
  {
    name: 'plan-readiness',
    usage: 'vybekiit plan-readiness <feature> [template]',
    summary: 'Report whether a feature is ready to wire',
    group: 'agent',
  },
  {
    name: 'plan-setup',
    usage: 'vybekiit plan-setup <domain>',
    summary: 'Plan setup steps for a domain concern',
    group: 'agent',
  },
  {
    name: 'plan-data-model',
    usage: 'vybekiit plan-data-model <entities.json> [provider]',
    summary: 'Plan database tables/collections from entity JSON',
    group: 'agent',
  },
  {
    name: 'list-pieces',
    usage: 'vybekiit list-pieces [--kind=db|page-recipe|backend]',
    summary: 'List installable kit pieces',
    group: 'agent',
  },
  {
    name: 'list-page-recipes',
    usage: 'vybekiit list-page-recipes',
    summary: 'List page recipe catalog ids',
    group: 'agent',
  },
  {
    name: 'list-presets',
    usage: 'vybekiit list-presets',
    summary: 'List data presets for apply-preset',
    group: 'agent',
  },
  {
    name: 'add page-recipe',
    usage: 'vybekiit add page-recipe <id> [--to=dir] [--dry-run] [--force]',
    summary: 'Install a page recipe into the buyer app',
    group: 'agent',
  },
  {
    name: 'apply-preset',
    usage: 'vybekiit apply-preset <id> [--provider=…] [--cwd=dir] [--dry-run]',
    summary: 'Apply a data preset for the active provider',
    group: 'agent',
  },
  {
    name: 'verify-presets',
    usage: 'vybekiit verify-presets [--fix] [--cwd=dir] [preset...]',
    summary: 'Verify applied presets still match the kit',
    group: 'agent',
  },
  {
    name: 'doc-fallback',
    usage: 'vybekiit doc-fallback <tech-id>',
    summary: 'Official docs + env keys when MCP/debug fails once',
    group: 'agent',
  },
  {
    name: 'env wizard',
    usage: 'vybekiit env wizard',
    summary: 'Interactive env setup for required secrets',
    group: 'ops',
  },
  {
    name: 'add bridge',
    usage: 'vybekiit add bridge',
    summary: 'Install ai-browser-bridge for web-chat MCP tools',
    group: 'ops',
  },
  {
    name: 'automate',
    usage: 'vybekiit-automate <domain> <command> --json [--yes] [--cdp=] [--profile=]',
    summary:
      'Browser dashboard automation (LS, CWS, registrars, dbs, …). Prefer MCP search_automations / run_automation',
    group: 'ops',
  },
  {
    name: 'automate catalog',
    usage: 'vybekiit-automate catalog --json',
    summary: 'List all automation domains/verbs as JSON (agent discovery)',
    group: 'ops',
  },
  {
    name: 'dedup',
    usage: 'vybekiit dedup [--intent <desc>] [--target <file>] [--scope <dir>] [--json]',
    summary: 'Find near-duplicate code before writing more',
    group: 'ops',
  },
  {
    name: 'scaffold backend',
    usage: 'vybekiit scaffold backend [directory]',
    summary: 'Scaffold the backend template surface',
    group: 'backend',
  },
  {
    name: 'backend add-route',
    usage: 'vybekiit backend add-route <name>',
    summary: 'Add an API route stub on the backend surface',
    group: 'backend',
  },
  {
    name: 'backend add-crud',
    usage: 'vybekiit backend add-crud <resource>',
    summary: 'Scaffold CRUD routes for a resource',
    group: 'backend',
  },
  {
    name: 'backend add-upload',
    usage: 'vybekiit backend add-upload',
    summary: 'Scaffold a file upload endpoint',
    group: 'backend',
  },
] as const;

/** Scored slim command row for search results. */
export type SlimCliCommand = {
  readonly name: string;
  readonly usage: string;
  readonly summary: string;
  readonly group: CliCommandEntry['group'];
  readonly score: number;
};

/**
 * Fuzzy-search CLI commands with cursor pagination.
 *
 * @param query - Free-text query (empty = list all).
 * @param options - Optional limit and cursor.
 * @returns Page of slim command rows.
 * @example
 * searchCommands('doctor', { limit: 5 });
 */
export const searchCommands = (
  query: string,
  options?: { readonly limit?: number; readonly cursor?: string },
): PageResult<SlimCliCommand> => {
  const trimmed = query.trim();
  const ranked = CLI_COMMANDS.map((entry) => {
    const score =
      trimmed.length === 0
        ? 1
        : scoreQuery(trimmed, [entry.name, entry.usage, entry.summary, entry.group]);
    return { entry, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .map(({ entry, score }) => ({
      name: entry.name,
      usage: entry.usage,
      summary: entry.summary,
      group: entry.group,
      score,
    }));

  return paginate(ranked, options);
};

/**
 * Look up one CLI command by exact name.
 *
 * @param name - Command name as listed in {@link CLI_COMMANDS}.
 * @returns The entry, or undefined when unknown.
 * @example
 * getCommand('doctor')?.usage;
 */
export const getCommand = (name: string): CliCommandEntry | undefined =>
  CLI_COMMANDS.find((entry) => entry.name === name);
