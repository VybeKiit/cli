import process from 'node:process';
import { type ExecFn, makeExec } from './exec';

/** A single MCP server we can register globally (user scope). */
export type McpServerDef = {
  readonly name: string;
  /** stdio servers run a local command; sse servers connect to a URL. */
  readonly transport: 'stdio' | 'sse';
  /** For stdio: the command + args (e.g. ['npx','-y','pkg']). For sse: [url]. */
  readonly command: readonly string[];
  /** Env vars the server needs — it is only registered when all are present. */
  readonly envKeys?: readonly string[];
};

// Zero-config servers register unconditionally — the point of the global install: they need no
// key and connect immediately. Browser automation everywhere = playwright; context7 = live
// library docs. Anything needing a token or OAuth is KEY_GATED so we never register a server
// that would sit "failed to connect".
const ZERO_CONFIG: readonly McpServerDef[] = [
  {
    name: 'vybekiit',
    transport: 'stdio',
    command: ['npx', '-y', 'vybekiit@latest', 'mcp', 'serve'],
  },
  {
    name: 'playwright',
    transport: 'stdio',
    command: ['npx', '-y', '@playwright/mcp@latest'],
  },
  { name: 'context7', transport: 'stdio', command: ['npx', '-y', '@upstash/context7-mcp@latest'] },
];

// Key-gated catalog servers — registered only when their token is already in the
// environment, so we never leave broken "failed to connect" servers in the user's config.
// The rest stay available via `vybekiit env wizard`.
const KEY_GATED: readonly McpServerDef[] = [
  {
    name: 'github',
    transport: 'stdio',
    command: ['npx', '-y', '@modelcontextprotocol/server-github'],
    envKeys: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
  },
  {
    name: 'supabase',
    transport: 'stdio',
    command: ['npx', '-y', '@supabase/mcp-server-supabase@latest'],
    envKeys: ['SUPABASE_ACCESS_TOKEN'],
  },
  {
    name: 'stripe',
    transport: 'stdio',
    command: ['npx', '-y', '@stripe/mcp', '--tools=all'],
    envKeys: ['STRIPE_SECRET_KEY'],
  },
  {
    // Sentry's hosted server is OAuth-only (would sit "failed to connect" until the user
    // authenticates in a browser); its stdio server takes a token, so gate on that like the rest.
    name: 'sentry',
    transport: 'stdio',
    command: ['npx', '-y', '@sentry/mcp-server@latest'],
    envKeys: ['SENTRY_ACCESS_TOKEN'],
  },
  {
    name: 'figma',
    transport: 'stdio',
    command: ['npx', '-y', 'figma-developer-mcp', '--stdio'],
    envKeys: ['FIGMA_API_KEY'],
  },
  {
    name: 'resend',
    transport: 'stdio',
    command: ['npx', '-y', 'resend-mcp'],
    envKeys: ['RESEND_API_KEY'],
  },
  {
    name: 'exa',
    transport: 'stdio',
    command: ['npx', '-y', 'exa-mcp-server'],
    envKeys: ['EXA_API_KEY'],
  },
  {
    name: 'tavily',
    transport: 'stdio',
    command: ['npx', '-y', 'tavily-mcp'],
    envKeys: ['TAVILY_API_KEY'],
  },
];

/** Dependencies for the MCP install, injected so arg-building is testable without shelling out. */
export type McpInstallDeps = {
  /** Runs the `claude` binary with the given args. */
  readonly exec: ExecFn;
  /** Environment used to resolve key-gated servers. */
  readonly env: Record<string, string | undefined>;
  /**
   * When true (CLI auto-update / re-run), remove then re-add zero-config servers so command
   * args track the latest CLI. Key-gated servers already present stay put (user may have
   * customised them); missing ones with keys are still added.
   */
  readonly forceRefresh?: boolean;
};

/** What {@link installGlobalMcp} did. */
export type McpInstallResult = {
  readonly enabled: readonly string[];
  readonly alreadyPresent: readonly string[];
  /** Zero-config servers re-registered on an update re-run. */
  readonly refreshed: readonly string[];
  readonly needsKey: readonly string[];
  readonly failed: readonly string[];
  readonly claudeMissing: boolean;
};

/** Whether Claude has a user-scoped VybeKiit server after this install attempt. */
export const isVybekiitMcpReady = (installation: McpInstallResult): boolean =>
  [...installation.enabled, ...installation.alreadyPresent, ...installation.refreshed].includes(
    'vybekiit',
  );

const defaultDeps: McpInstallDeps = { exec: makeExec('claude'), env: process.env };
const USER_SCOPE_LINE = /^\s*Scope:\s+User(?:\s+config)?\b/m;

/**
 * Build the `claude mcp add` argument list for a server (user scope).
 *
 * @param def - The server definition.
 * @param env - Environment used to inline `-e KEY=value` flags.
 * @returns The argument vector passed to `claude`.
 * @example
 * claudeMcpAddArgv(ZERO_CONFIG[0], {}); // ['mcp','add','-s','user','playwright','--','npx',...]
 */
export const claudeMcpAddArgv = (
  def: McpServerDef,
  env: Record<string, string | undefined>,
): string[] => {
  if (def.transport === 'sse') {
    const [url = ''] = def.command;
    return ['mcp', 'add', '-s', 'user', '--transport', 'sse', def.name, url];
  }
  const envFlags = (def.envKeys ?? []).flatMap((key) => ['-e', `${key}=${env[key] ?? ''}`]);
  return ['mcp', 'add', '-s', 'user', ...envFlags, def.name, '--', ...def.command];
};

/**
 * Whether every env var a server needs is present and non-empty.
 *
 * @param def - Server definition.
 * @param env - Environment to check.
 * @returns True when the server can be registered now.
 */
const hasKeys = (def: McpServerDef, env: Record<string, string | undefined>): boolean =>
  (def.envKeys ?? []).every((key) => (env[key] ?? '') !== '');

/**
 * Whether a server definition is zero-config (always refreshable on auto-update).
 *
 * @param def - Server definition.
 * @returns True for playwright / context7 entries.
 */
const isZeroConfig = (def: McpServerDef): boolean =>
  ZERO_CONFIG.some((entry) => entry.name === def.name);

/**
 * Register the zero-config MCP servers globally (plus any key-gated server whose token is
 * already set). Idempotent by default; with `forceRefresh`, re-adds zero-config servers so a
 * re-run of `vybekiit setup` picks up CLI definition changes.
 *
 * @param deps - Injected executor + environment (defaults to real `claude` + process.env).
 * @returns A breakdown of enabled / refreshed / already-present / needs-key / failed servers.
 */
export const installGlobalMcp = async (
  deps: McpInstallDeps = defaultDeps,
): Promise<McpInstallResult> => {
  const version = await deps.exec(['--version']);
  if (version.code === 127) {
    return {
      enabled: [],
      alreadyPresent: [],
      refreshed: [],
      needsKey: [],
      failed: [],
      claudeMissing: true,
    };
  }

  const enabled: string[] = [];
  const alreadyPresent: string[] = [];
  const refreshed: string[] = [];
  const needsKey: string[] = [];
  const failed: string[] = [];
  const forceRefresh = deps.forceRefresh === true;

  // Older kits wrote a shared project entry. Remove only that stale scope so it cannot
  // shadow the user-scoped server; Claude preserves every other project MCP entry.
  await deps.exec(['mcp', 'remove', '-s', 'project', 'vybekiit']);

  const candidates = [...ZERO_CONFIG, ...KEY_GATED];
  for (const def of candidates) {
    if (!hasKeys(def, deps.env)) {
      needsKey.push(def.name);
      continue;
    }
    const inspected = await deps.exec(['mcp', 'get', def.name]);
    const present = inspected.code === 0 && USER_SCOPE_LINE.test(inspected.stdout);
    if (present && forceRefresh && isZeroConfig(def)) {
      // Best-effort remove: if remove fails we still try add (some claude versions upsert).
      await deps.exec(['mcp', 'remove', '-s', 'user', def.name]);
      const readded = await deps.exec(claudeMcpAddArgv(def, deps.env));
      if (readded.code === 0) {
        refreshed.push(def.name);
      } else {
        failed.push(def.name);
      }
      continue;
    }
    if (present) {
      alreadyPresent.push(def.name);
      continue;
    }
    const added = await deps.exec(claudeMcpAddArgv(def, deps.env));
    if (added.code === 0) {
      enabled.push(def.name);
    } else {
      failed.push(def.name);
    }
  }

  return { enabled, alreadyPresent, refreshed, needsKey, failed, claudeMissing: false };
};
