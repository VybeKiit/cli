/**
 * SSOT for first-party MCP servers + tools shipped with every kit workspace.
 * Renders the agent-facing skill bodies agents read locally or via get_skill.
 */

/** Package names always copied into a scaffolded kit (tooling MCP surface). */
export const FIRST_PARTY_MCP_PACKAGES = [
  '@vybekiit/agent-mcp',
  '@vybekiit/browser-automation',
] as const;

/** First-party MCP server id (Cursor / Claude / Codex config key). One server ships all tools. */
export type FirstPartyMcpServerId = 'vybekiit';

/** One documented MCP tool. */
export type McpToolCatalogEntry = {
  readonly name: string;
  readonly server: FirstPartyMcpServerId;
  readonly description: string;
  readonly requiredParams: readonly string[];
  readonly optionalParams: readonly string[];
  readonly whenToUse: string;
};

/** Path layout for resolving bin paths in mcp snippets / `.cursor/mcp.json`. */
export type FirstPartyMcpPathLayout = 'surface' | 'kit-root';

/** Stdio MCP server entry (Cursor / Claude project config). */
export type FirstPartyMcpStdioEntry = {
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
};

/** `{ mcpServers }` fragment for first-party servers. */
export type FirstPartyMcpServersConfig = {
  readonly mcpServers: Readonly<Record<FirstPartyMcpServerId, FirstPartyMcpStdioEntry>>;
};

/** Stem for the auto-discovered Agent Skill under `.agents/skills/`. */
export const USE_KIT_MCP_SKILL_STEM = 'use-kit-mcp';

/** Platform wrapper stem under `.vybekiit/platform-skills/`. */
export const MCP_TOOLS_PLATFORM_SKILL_STEM = 'mcp-tools-vybekiit';

/**
 * Phrases that route agents to the kit MCP skill via search_skills / goal match.
 * Agent-facing only — never name MCP tools to the builder.
 */
export const USE_KIT_MCP_PHRASES = [
  'mcp tools',
  'kit mcp',
  'vybekiit mcp',
  'what mcp tools',
  'ui catalog mcp',
  'search automations',
  'run automation',
  'browser automation scripts',
] as const;

/** Full tool catalog (must stay aligned with agentMcp agent + uiCatalog bin tools). */
export const FIRST_PARTY_MCP_TOOLS: readonly McpToolCatalogEntry[] = [
  {
    name: 'search_skills',
    server: 'vybekiit',
    description: 'Fuzzy-search buyer goals/skills (goal-index SSOT). Paginated slim rows.',
    requiredParams: ['query'],
    optionalParams: ['template', 'limit', 'cursor'],
    whenToUse: 'Before opening skill files; empty query lists all goals for the template.',
  },
  {
    name: 'get_skill',
    server: 'vybekiit',
    description: 'Load one skill by goal id or stem (excerpt by default).',
    requiredParams: ['id'],
    optionalParams: ['template', 'excerptLines'],
    whenToUse: 'After search_skills picks a row; also loads use-kit-mcp / platform wrappers.',
  },
  {
    name: 'list_platform_skills',
    server: 'vybekiit',
    description: 'List/search `.vybekiit/platform-skills/*` wrappers (paginated).',
    requiredParams: [],
    optionalParams: ['query', 'limit', 'cursor'],
    whenToUse: 'Find provider wrappers (stripe, railway, mcp-tools-vybekiit, …).',
  },
  {
    name: 'search_commands',
    server: 'vybekiit',
    description: 'Fuzzy-search vybekiit CLI verbs. Returns usage — run via shell, not MCP.',
    requiredParams: ['query'],
    optionalParams: ['limit', 'cursor'],
    whenToUse: 'Discover CLI verbs (doctor, create app, automate, …).',
  },
  {
    name: 'get_command',
    server: 'vybekiit',
    description: 'Get one CLI command by exact name from the catalog.',
    requiredParams: ['name'],
    optionalParams: [],
    whenToUse: 'After search_commands when you know the exact verb name.',
  },
  {
    name: 'search_doctor_tools',
    server: 'vybekiit',
    description:
      'List doctor toolchain entries (`vybekiit doctor --ensure <name>`). Does not run doctor.',
    requiredParams: ['query'],
    optionalParams: ['limit', 'cursor'],
    whenToUse: 'Before ensuring CLIs (gh, wrangler, supabase, …).',
  },
  {
    name: 'search_tech_ids',
    server: 'vybekiit',
    description: 'Fuzzy-search known tech ids before doc_fallback.',
    requiredParams: ['query'],
    optionalParams: ['limit', 'cursor'],
    whenToUse: 'Pick a tech id for official docs after one failed MCP/debug attempt.',
  },
  {
    name: 'doc_fallback',
    server: 'vybekiit',
    description:
      'Official docs + env key hints. Never name MCP to the builder — use builderMessage.',
    requiredParams: ['techId'],
    optionalParams: [],
    whenToUse: 'MCP or first debug failed once; same as `vybekiit doc-fallback <tech-id>`.',
  },
  {
    name: 'search_automations',
    server: 'vybekiit',
    description: 'Fuzzy-search vybekiit-automate browser verbs (ls, cws, nc, …). Paginated.',
    requiredParams: ['query'],
    optionalParams: ['limit', 'cursor'],
    whenToUse: 'Before run_automation; empty query lists the catalog.',
  },
  {
    name: 'get_automation',
    server: 'vybekiit',
    description: 'Get one automation by domain (+ command) or id (`ls:setup`).',
    requiredParams: ['domain'],
    optionalParams: ['command'],
    whenToUse: 'Inspect usage string for a known domain/verb.',
  },
  {
    name: 'run_automation',
    server: 'vybekiit',
    description:
      'Run vybekiit-automate from any project root (resolves bin). Always --json. Prefer dryRun first. Google redirect_uri_mismatch → domain=google command=oauth with --redirect incl. localhost.',
    requiredParams: ['domain', 'command'],
    optionalParams: ['args', 'dryRun', 'yes', 'cdp', 'profile', 'timeoutMs'],
    whenToUse:
      'Execute browser automations anywhere; OAuth 400 redirect_uri_mismatch; dryRun=true to preview argv only.',
  },
  {
    name: 'search_ui_components',
    server: 'vybekiit',
    description: 'Fuzzy-search mirrored UI components. Page envelope; default fields=slim.',
    requiredParams: ['query'],
    optionalParams: ['source', 'limit', 'cursor', 'fields'],
    whenToUse: 'Find blocks by intent/name; slim first, then get_ui_component.',
  },
  {
    name: 'get_ui_component',
    server: 'vybekiit',
    description: 'Get one mirrored component by source namespace + slug.',
    requiredParams: ['source', 'name'],
    optionalParams: [],
    whenToUse: 'Full detail after search_ui_components.',
  },
  {
    name: 'suggest_ui_blend',
    server: 'vybekiit',
    description: 'Ranked multi-source component suggestions for a natural-language UI intent.',
    requiredParams: ['intent'],
    optionalParams: ['limit'],
    whenToUse: 'Builder wants a composed look (hero + pricing + marquee, …).',
  },
  {
    name: 'list_ui_sources',
    server: 'vybekiit',
    description: 'List mirrored UI source namespaces and component counts.',
    requiredParams: [],
    optionalParams: [],
    whenToUse: 'See which registries are in the local catalog index.',
  },
];

/**
 * Relative bin path for a first-party MCP package from a path layout.
 *
 * @param packageFolder - Folder under packages/ (e.g. `agentMcp`).
 * @param layout - Surface (templates/*) vs kit monorepo root.
 * @returns Relative path to dist/bin.js.
 * @example
 * firstPartyMcpBinPath('agentMcp', 'surface'); // '../../packages/agentMcp/dist/bin.js'
 */
export const firstPartyMcpBinPath = (
  packageFolder: 'agentMcp',
  layout: FirstPartyMcpPathLayout,
): string =>
  layout === 'kit-root'
    ? `packages/${packageFolder}/dist/bin.js`
    : `../../packages/${packageFolder}/dist/bin.js`;

/**
 * Build first-party MCP server config for a path layout.
 *
 * @param layout - Where the agent opens the workspace (surface vs kit root).
 * @param options - Optional template for kit-root VYBEKIIT_PROJECT_ROOT.
 * @returns Config fragment ready to merge into `.cursor/mcp.json`.
 * @example
 * buildFirstPartyMcpConfig('surface');
 */
export const buildFirstPartyMcpConfig = (
  layout: FirstPartyMcpPathLayout,
  options?: { readonly template?: string },
): FirstPartyMcpServersConfig => {
  const projectRoot =
    layout === 'kit-root' && options?.template !== undefined && options.template !== ''
      ? `templates/${options.template}`
      : '.';
  const catalogPath =
    layout === 'kit-root' && options?.template !== undefined && options.template !== ''
      ? `templates/${options.template}/.vybekiit/agent/ui-catalog-index.json`
      : '.vybekiit/agent/ui-catalog-index.json';

  return {
    mcpServers: {
      vybekiit: {
        command: 'node',
        args: [firstPartyMcpBinPath('agentMcp', layout)],
        env: {
          VYBEKIIT_PROJECT_ROOT: projectRoot,
          VYBEKIIT_UI_CATALOG_PATH: catalogPath,
        },
      },
    },
  };
};

/**
 * Tool names registered on one first-party server.
 *
 * @param server - Server id.
 * @returns Ordered tool names.
 * @example
 * toolsForServer('vybekiit');
 */
export const toolsForServer = (server: FirstPartyMcpServerId): readonly string[] =>
  FIRST_PARTY_MCP_TOOLS.filter((tool) => tool.server === server).map((tool) => tool.name);

/**
 * Format one tool row for the skill markdown tables.
 *
 * @param tool - Catalog entry.
 * @returns Markdown table row.
 */
const formatToolRow = (tool: McpToolCatalogEntry): string => {
  const required = tool.requiredParams.length === 0 ? '—' : tool.requiredParams.join(', ');
  const optional = tool.optionalParams.length === 0 ? '—' : tool.optionalParams.join(', ');
  return `| \`${tool.name}\` | ${tool.description} | ${required} | ${optional} | ${tool.whenToUse} |`;
};

/**
 * Render the agent-only platform skill body (no YAML frontmatter).
 *
 * @returns Markdown for `.vybekiit/platform-skills/mcp-tools-vybekiit.md`.
 * @example
 * renderMcpToolsPlatformSkill();
 */
export const renderMcpToolsPlatformSkill = (): string => {
  const lines = [
    '# Platform wrapper: kit MCP tools',
    '',
    '**Agent-only.** Catalog of every first-party MCP tool VybeKiit ships. Read this file locally or load via MCP `get_skill` / `list_platform_skills` (`mcp-tools-vybekiit` / `use-kit-mcp`).',
    '',
    'Never name MCP, tool ids, or package paths to the builder. Prefer **search → get** (slim pages, then detail).',
    '',
    '## Server',
    '',
    '| Server key | Package | Bin | Purpose |',
    '|------------|---------|-----|---------|',
    '| `vybekiit` | `@vybekiit/agent-mcp` | `vybekiit-agent-mcp` | Skills, CLI catalog, doctor tools, doc-fallback, browser automations, mirrored UI catalog |',
    '',
    'Snippet: `.vybekiit/agent/mcp-agent.json`. Setup: `.vybekiit/agent/mcp-setup.md`.',
    'Auto-discovered skill: `.agents/skills/use-kit-mcp/SKILL.md`.',
    '',
    '## Env',
    '',
    '| Variable | Meaning |',
    '|----------|---------|',
    '| `VYBEKIIT_PROJECT_ROOT` | Project root for skill reads + automation cwd (default cwd) |',
    '| `VYBEKIIT_UI_CATALOG_PATH` | Path to `ui-catalog-index.json` |',
    '| `VYBEKIIT_AUTOMATE_BIN` | Optional absolute path to `vybekiit-automate` |',
    '',
    '## Context controls',
    '',
    '- Cursor pagination: `limit` / `cursor` / response `nextCursor` + `hasMore` + `total`',
    '- Prefer slim rows; request full detail only when needed (`fields=slim|full` on UI tools)',
    '- Automations: `run_automation({ dryRun: true })` before a real browser session',
    '',
    '## Tools',
    '',
    '| Tool | Description | Required | Optional | When to use |',
    '|------|-------------|----------|----------|-------------|',
    ...FIRST_PARTY_MCP_TOOLS.map(formatToolRow),
    '',
    '## Browser automations (from any folder)',
    '',
    '```',
    'search_automations({ query: "lemon squeezy" })',
    'run_automation({ domain: "ls", command: "setup", dryRun: true })',
    'run_automation({ domain: "ls", command: "standby" })',
    '// Google Error 400 redirect_uri_mismatch / Auth.js localhost — args only, no Console babysitting:',
    'search_automations({ query: "redirect_uri_mismatch" })',
    'run_automation({ domain: "google", command: "oauth", args: [',
    '  "--project=my-app", "--app-name=MyApp", "--support-email=you@gmail.com",',
    '  "--app-url=https://example.com",',
    '  "--redirect=https://example.com/api/auth/callback/google",',
    '  "--redirect=http://localhost:3000/api/auth/callback/google",',
    ']})',
    '```',
    '',
    'Shell equivalent:',
    '',
    '```',
    'vybekiit-automate catalog --json',
    'vybekiit-automate ls standby --json --yes',
    'vybekiit-automate google oauth --project=... --app-name=... --support-email=... --app-url=... --redirect=... --json',
    '```',
    '',
    '## Wire-up (agents)',
    '',
    '1. After `pnpm build` (or package dist present), merge `mcp-agent.json` into the client config (see `mcp-setup.md`).',
    '2. `create app` and kit workspaces always ship `@vybekiit/agent-mcp` and `@vybekiit/browser-automation` under `packages/` (UI catalog tools are served by the same `vybekiit` server).',
    '3. Project `.cursor/mcp.json` is written on scaffold (surface layout). Kit root also gets a kit-root layout config.',
    '4. Doctor may merge core third-party MCPs; first-party entries are preserved when already present.',
    '',
    '## Provider / third-party MCP snippets',
    '',
    'Not first-party tools — merge only when the builder uses that provider (see `mcp-setup.md`):',
    '`mcp-supabase`, `mcp-stripe`, `mcp-paypal`, `mcp-neon`, `mcp-firebase`, `mcp-mongodb`, `mcp-railway-*`, `mcp-twilio-*`, `mcp-sentry`, `mcp-posthog`.',
    '',
    'If any MCP fails once → `doc_fallback` / `vybekiit doc-fallback <tech-id>`; tell the builder only the plain stuck phrase.',
    '',
  ];
  return lines.join('\n');
};

/**
 * Render the Cursor/Claude auto-discovered SKILL.md for kit MCP tools.
 *
 * @returns Markdown with YAML frontmatter for `.agents/skills/use-kit-mcp/SKILL.md`.
 * @example
 * renderUseKitMcpSkillMd();
 */
export const renderUseKitMcpSkillMd = (): string => {
  const body = renderMcpToolsPlatformSkill()
    .replace(/^# Platform wrapper: kit MCP tools\n\n/, '')
    .trimStart();
  return [
    '---',
    `name: ${USE_KIT_MCP_SKILL_STEM}`,
    'description: >-',
    '  Catalog of every first-party MCP tool VybeKiit ships (skills, CLI, doctor,',
    '  doc-fallback, browser automations, UI catalog). Use when the agent needs',
    '  MCP tool names, args, pagination, or how to run automations from anywhere.',
    '  Agent-only — never name MCP to the builder.',
    'metadata:',
    '  vybekiit: first-party-mcp-catalog',
    '---',
    '',
    '# Skill: use-kit-mcp',
    '',
    '**Goal (agent-only):** know and use every MCP tool shipped with VybeKiit — locally as this file, or live via the `vybekiit` MCP server.',
    '',
    body,
    '',
  ].join('\n');
};

/**
 * Pretty-print first-party MCP config JSON for snippets / project files.
 *
 * @param config - Config from {@link buildFirstPartyMcpConfig}.
 * @returns JSON string with trailing newline.
 * @example
 * formatFirstPartyMcpConfigJson(buildFirstPartyMcpConfig('surface'));
 */
export const formatFirstPartyMcpConfigJson = (config: {
  readonly mcpServers: Readonly<Record<string, unknown>>;
}): string =>
  `${JSON.stringify(config, null, 2)}\n`;
