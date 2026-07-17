import { execFile } from 'node:child_process';
import process from 'node:process';

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

// Zero-config servers register unconditionally — the point of the global install. Browser
// automation everywhere = playwright; context7 = live library docs; sentry = remote OAuth.
const ZERO_CONFIG: readonly McpServerDef[] = [
  {
    name: 'playwright',
    transport: 'stdio',
    command: ['npx', '-y', '@anthropic-ai/mcp-playwright'],
  },
  { name: 'context7', transport: 'stdio', command: ['npx', '-y', '@upstash/context7-mcp@latest'] },
  { name: 'sentry', transport: 'sse', command: ['https://mcp.sentry.dev/sse'] },
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
    command: ['npx', '-y', 'supabase-mcp-server'],
    envKeys: ['SUPABASE_ACCESS_TOKEN'],
  },
  {
    name: 'vercel',
    transport: 'stdio',
    command: ['npx', '-y', '@vercel/mcp'],
    envKeys: ['VERCEL_TOKEN'],
  },
  {
    name: 'stripe',
    transport: 'stdio',
    command: ['npx', '-y', '@stripe/mcp'],
    envKeys: ['STRIPE_SECRET_KEY'],
  },
  {
    name: 'cloudflare',
    transport: 'stdio',
    command: ['npx', '-y', '@anthropic-ai/mcp-cloudflare'],
    envKeys: ['CLOUDFLARE_API_TOKEN'],
  },
  {
    name: 'figma',
    transport: 'stdio',
    command: ['npx', '-y', '@anthropic-ai/mcp-figma'],
    envKeys: ['FIGMA_ACCESS_TOKEN'],
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
    name: 'firecrawl',
    transport: 'stdio',
    command: ['npx', '-y', 'firecrawl-mcp'],
    envKeys: ['FIRECRAWL_API_KEY'],
  },
  {
    name: 'tavily',
    transport: 'stdio',
    command: ['npx', '-y', 'tavily-mcp'],
    envKeys: ['TAVILY_API_KEY'],
  },
];

/** Result of a single `claude` invocation. */
export type ExecResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/** Dependencies for the MCP install, injected so arg-building is testable without shelling out. */
export type McpInstallDeps = {
  /** Runs the `claude` binary with the given args. */
  readonly exec: (args: readonly string[]) => Promise<ExecResult>;
  /** Environment used to resolve key-gated servers. */
  readonly env: Record<string, string | undefined>;
};

/** What {@link installGlobalMcp} did. */
export type McpInstallResult = {
  readonly enabled: readonly string[];
  readonly alreadyPresent: readonly string[];
  readonly needsKey: readonly string[];
  readonly failed: readonly string[];
  readonly claudeMissing: boolean;
};

const defaultExec = (args: readonly string[]): Promise<ExecResult> =>
  new Promise((resolve) => {
    execFile('claude', [...args], { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error && 'code' in error && error.code === 'ENOENT') {
        resolve({ code: 127, stdout: '', stderr: 'claude not found' });
        return;
      }
      let code = 0;
      if (error) {
        code = typeof error.code === 'number' ? error.code : 1;
      }
      resolve({ code, stdout: stdout ?? '', stderr: stderr ?? '' });
    });
  });

const defaultDeps: McpInstallDeps = { exec: defaultExec, env: process.env };

/**
 * Build the `claude mcp add` argument list for a server (user scope).
 *
 * @param def - The server definition.
 * @param env - Environment used to inline `-e KEY=value` flags.
 * @returns The argument vector passed to `claude`.
 * @example
 * buildAddArgs(ZERO_CONFIG[0], {}); // ['mcp','add','-s','user','playwright','--','npx',...]
 */
export const buildAddArgs = (
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
 * Register the zero-config MCP servers globally (plus any key-gated server whose token is
 * already set). Idempotent: servers already present are left alone.
 *
 * @param deps - Injected executor + environment (defaults to real `claude` + process.env).
 * @returns A breakdown of enabled / already-present / needs-key / failed servers.
 * @example
 * const result = await installGlobalMcp();
 */
export const installGlobalMcp = async (
  deps: McpInstallDeps = defaultDeps,
): Promise<McpInstallResult> => {
  const version = await deps.exec(['--version']);
  if (version.code === 127) {
    return { enabled: [], alreadyPresent: [], needsKey: [], failed: [], claudeMissing: true };
  }

  const enabled: string[] = [];
  const alreadyPresent: string[] = [];
  const needsKey: string[] = [];
  const failed: string[] = [];

  const candidates = [...ZERO_CONFIG, ...KEY_GATED];
  for (const def of candidates) {
    if (!hasKeys(def, deps.env)) {
      needsKey.push(def.name);
      continue;
    }
    if ((await deps.exec(['mcp', 'get', def.name])).code === 0) {
      alreadyPresent.push(def.name);
      continue;
    }
    const added = await deps.exec(buildAddArgs(def, deps.env));
    if (added.code === 0) {
      enabled.push(def.name);
    } else {
      failed.push(def.name);
    }
  }

  return { enabled, alreadyPresent, needsKey, failed, claudeMissing: false };
};
