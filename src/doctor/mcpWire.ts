import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { AgentId, DetectedAgent } from '../lib/agentDetection';

/** One server entry from a project `mcp-servers.json` catalog. */
export type McpCatalogServer = {
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
  readonly priority?: number;
  readonly command: string;
  readonly env?: readonly string[];
};

/** Stdio MCP server entry used by Cursor / Claude project config. */
export type McpStdioEntry = {
  readonly command: string;
  readonly args: readonly string[];
};

/** Remote (URL) MCP server entry. */
export type McpUrlEntry = {
  readonly url: string;
};

/** One project MCP server (stdio or remote URL). */
export type McpServerEntry = McpStdioEntry | McpUrlEntry;

/** Project MCP config shape (Cursor `.cursor/mcp.json`, Claude `.mcp.json`). */
export type McpServersConfig = {
  readonly mcpServers: Readonly<Record<string, McpServerEntry>>;
};

/** Injectable I/O for MCP wiring (tests). */
export type McpWireDeps = {
  readonly pathExists: (path: string) => boolean;
  readonly readFile: (path: string) => string;
  readonly writeFile: (path: string, content: string) => void;
  readonly mkdir: (path: string) => void;
  readonly commandExists: (command: string) => boolean;
  readonly spawn: (
    command: string,
    args: readonly string[],
    options?: { readonly cwd?: string },
  ) => { readonly status: number | null };
};

/** Outcome of wiring curated core assistant tools into agent project configs. */
export type McpWireResult = {
  readonly ok: boolean;
  readonly wired: boolean;
  readonly coreServerNames: readonly string[];
  readonly agentsWired: readonly AgentId[];
  readonly lines: readonly string[];
};

/** Relative catalog locations checked under the project root (first match wins). */
const CATALOG_RELATIVE_PATHS = [
  join('.claude', 'mcp', 'mcp-servers.json'),
  'mcp-servers.json',
] as const;

/**
 * Probe whether a command is on PATH.
 *
 * @param command - Executable name.
 * @returns True when `command --version` or `--help` can spawn without ENOENT.
 * @example
 * const present = defaultCommandExists('claude');
 */
const defaultCommandExists = (command: string): boolean => {
  const version = spawnSync(command, ['--version'], { stdio: 'ignore' });
  if (version.status === 0) {
    return true;
  }
  const help = spawnSync(command, ['--help'], { stdio: 'ignore' });
  return help.status === 0 || help.error === undefined;
};

/**
 * Build default MCP wire deps bound to the real filesystem and process.
 *
 * @returns Deps used by doctor in production.
 * @example
 * const deps = createDefaultMcpWireDeps();
 */
export const createDefaultMcpWireDeps = (): McpWireDeps => ({
  pathExists: (path) => existsSync(path),
  readFile: (path) => readFileSync(path, 'utf8'),
  writeFile: (path, content) => {
    writeFileSync(path, content, 'utf8');
  },
  mkdir: (path) => {
    mkdirSync(path, { recursive: true });
  },
  commandExists: defaultCommandExists,
  spawn: (command, spawnArgs, spawnOptions) => {
    // Cap duration so optional `claude mcp add` never hangs an interactive doctor.
    const spawnOutcome = spawnSync(command, [...spawnArgs], {
      stdio: 'ignore',
      cwd: spawnOptions?.cwd,
      timeout: 8000,
      env: { ...process.env, CI: process.env.CI ?? '1' },
    });
    return { status: spawnOutcome.status };
  },
});

/**
 * Resolve the project MCP catalog path when present.
 *
 * @param cwd - Project directory.
 * @param pathExists - Path probe.
 * @returns Absolute catalog path, or null when no catalog file exists.
 * @example
 * const path = findMcpCatalogPath(process.cwd(), existsSync);
 */
export const findMcpCatalogPath = (
  cwd: string,
  pathExists: (path: string) => boolean,
): string | null => {
  for (const relative of CATALOG_RELATIVE_PATHS) {
    const absolute = join(cwd, relative);
    if (pathExists(absolute)) {
      return absolute;
    }
  }
  return null;
};

/** Typed server rows from `mcp-servers.json`; invalid rows dropped. */
export const parseMcpCatalog = (catalogText: string): readonly McpCatalogServer[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(catalogText) as unknown;
  } catch {
    return [];
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [];
  }
  const servers = (parsed as { readonly servers?: unknown }).servers;
  if (!Array.isArray(servers)) {
    return [];
  }
  const out: McpCatalogServer[] = [];
  for (const row of servers) {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      continue;
    }
    const record = row as Record<string, unknown>;
    const name = record.name;
    const command = record.command;
    if (typeof name !== 'string' || name === '' || typeof command !== 'string' || command === '') {
      continue;
    }
    const envRaw = record.env;
    const env =
      Array.isArray(envRaw) && envRaw.every((item): item is string => typeof item === 'string')
        ? envRaw
        : undefined;
    out.push({
      name,
      command,
      ...(typeof record.description === 'string' ? { description: record.description } : {}),
      ...(typeof record.category === 'string' ? { category: record.category } : {}),
      ...(typeof record.priority === 'number' ? { priority: record.priority } : {}),
      ...(env === undefined ? {} : { env }),
    });
  }
  return out;
};

/**
 * Select curated core servers (category `core` or priority `1`).
 *
 * @param servers - Full catalog rows.
 * @returns Core-only subset (docs + GitHub in the kit catalog).
 * @example
 * const core = selectCoreMcpServers(parseMcpCatalog(raw));
 */
export const selectCoreMcpServers = (
  servers: readonly McpCatalogServer[],
): readonly McpCatalogServer[] =>
  servers.filter((server) => server.category === 'core' || server.priority === 1);

/**
 * Split a catalog command string into executable + args.
 *
 * Catalog commands are space-separated (e.g. `npx -y @upstash/context7-mcp@latest`).
 *
 * @param commandLine - Full command from the catalog.
 * @returns Executable and argument list.
 * @example
 * const parts = splitCatalogCommand('npx -y @modelcontextprotocol/server-github');
 * // → { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] }
 */
export const splitCatalogCommand = (
  commandLine: string,
): { readonly command: string; readonly args: readonly string[] } => {
  const tokens = commandLine
    .trim()
    .split(/\s+/)
    .filter((token) => token !== '');
  if (tokens.length === 0) {
    return { command: '', args: [] };
  }
  const [command = '', ...args] = tokens;
  return { command, args };
};

/**
 * Cursor/Claude MCP config entry for one catalog server.
 *
 * Remote catalog commands use the `remote:<url>` prefix and become `{ url }`.
 * Stdio commands become `{ command, args }`. Secrets are never written —
 * env key names from the catalog are not materialized as values.
 */
export const mcpEntryFromCatalogServer = (server: McpCatalogServer): McpServerEntry | null => {
  const trimmed = server.command.trim();
  if (trimmed === '') {
    return null;
  }
  if (trimmed.startsWith('remote:')) {
    const remoteUrl = trimmed.slice('remote:'.length).trim();
    if (remoteUrl === '') {
      return null;
    }
    return { url: remoteUrl };
  }
  const { command, args: commandArgs } = splitCatalogCommand(trimmed);
  if (command === '') {
    return null;
  }
  return { command, args: commandArgs };
};

/** Full `{ mcpServers }` project config from catalog core rows. */
export const mcpServersConfigFromCatalog = (
  servers: readonly McpCatalogServer[],
): McpServersConfig => {
  const mcpServers: Record<string, McpServerEntry> = {};
  for (const server of servers) {
    const mcpEntry = mcpEntryFromCatalogServer(server);
    if (mcpEntry === null) {
      continue;
    }
    mcpServers[server.name] = mcpEntry;
  }
  return { mcpServers };
};

/**
 * Merge curated core servers into an existing project MCP config without
 * clobbering buyer-owned entries that already exist under the same name.
 */
export const mergeCoreMcpServers = (
  existing: McpServersConfig,
  core: readonly McpCatalogServer[],
): { readonly config: McpServersConfig; readonly added: readonly string[] } => {
  const next: Record<string, McpServerEntry> = { ...existing.mcpServers };
  const added: string[] = [];
  for (const server of core) {
    if (next[server.name] !== undefined) {
      continue;
    }
    const mcpEntry = mcpEntryFromCatalogServer(server);
    if (mcpEntry === null) {
      continue;
    }
    next[server.name] = mcpEntry;
    added.push(server.name);
  }
  return { config: { mcpServers: next }, added };
};

/** Existing project MCP JSON; invalid/missing shape yields empty servers. */
export const parseMcpServersConfig = (configText: string): McpServersConfig => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(configText) as unknown;
  } catch {
    return { mcpServers: {} };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { mcpServers: {} };
  }
  const servers = (parsed as { readonly mcpServers?: unknown }).mcpServers;
  if (servers === null || typeof servers !== 'object' || Array.isArray(servers)) {
    return { mcpServers: {} };
  }
  const mcpServers: Record<string, McpServerEntry> = {};
  for (const [serverName, serverValue] of Object.entries(servers as Record<string, unknown>)) {
    if (serverValue === null || typeof serverValue !== 'object' || Array.isArray(serverValue)) {
      continue;
    }
    const serverFields = serverValue as Record<string, unknown>;
    if (typeof serverFields.url === 'string' && serverFields.url !== '') {
      mcpServers[serverName] = { url: serverFields.url };
      continue;
    }
    if (typeof serverFields.command === 'string' && serverFields.command !== '') {
      const commandArgs = Array.isArray(serverFields.args)
        ? serverFields.args.filter((arg): arg is string => typeof arg === 'string')
        : [];
      mcpServers[serverName] = { command: serverFields.command, args: commandArgs };
    }
  }
  return { mcpServers };
};

/**
 * Serialize project MCP config as pretty JSON with trailing newline.
 *
 * @param config - Config object.
 * @returns File contents.
 * @example
 * const text = formatMcpServersConfig(config);
 */
export const formatMcpServersConfig = (config: McpServersConfig): string =>
  `${JSON.stringify(config, null, 2)}\n`;

/**
 * Load core servers from the project catalog when present.
 *
 * @param cwd - Project directory.
 * @param deps - File probes.
 * @returns Core catalog rows (empty when catalog missing or invalid).
 * @example
 * const core = loadCoreMcpServers(process.cwd(), createDefaultMcpWireDeps());
 */
export const loadCoreMcpServers = (
  cwd: string,
  deps: Pick<McpWireDeps, 'pathExists' | 'readFile'>,
): readonly McpCatalogServer[] => {
  const catalogPath = findMcpCatalogPath(cwd, deps.pathExists);
  if (catalogPath === null) {
    return [];
  }
  try {
    const catalogText = deps.readFile(catalogPath);
    return selectCoreMcpServers(parseMcpCatalog(catalogText));
  } catch {
    return [];
  }
};

/**
 * Read core MCP server names from a project catalog when present.
 *
 * @param cwd - Project directory.
 * @param deps - Optional file probes (defaults to real FS).
 * @returns Core server names, or empty when catalog missing.
 * @example
 * const names = readCoreMcpServerNames(process.cwd());
 */
export const readCoreMcpServerNames = (
  cwd: string,
  deps: Pick<McpWireDeps, 'pathExists' | 'readFile'> = createDefaultMcpWireDeps(),
): readonly string[] => loadCoreMcpServers(cwd, deps).map((server) => server.name);

/**
 * Merge core servers into a project MCP config file, creating parents as needed.
 *
 * @param configPath - Absolute path to `.cursor/mcp.json` or `.mcp.json`.
 * @param core - Core catalog servers.
 * @param deps - File I/O.
 * @returns Whether the file was written and which server names were newly added.
 */
export const writeMergedMcpConfig = (
  configPath: string,
  core: readonly McpCatalogServer[],
  deps: McpWireDeps,
): { readonly written: boolean; readonly added: readonly string[] } => {
  let existing: McpServersConfig = { mcpServers: {} };
  if (deps.pathExists(configPath)) {
    try {
      existing = parseMcpServersConfig(deps.readFile(configPath));
    } catch {
      existing = { mcpServers: {} };
    }
  }
  const { config, added } = mergeCoreMcpServers(existing, core);
  if (added.length === 0 && deps.pathExists(configPath)) {
    return { written: false, added: [] };
  }
  deps.mkdir(dirname(configPath));
  deps.writeFile(configPath, formatMcpServersConfig(config));
  return { written: true, added };
};

/**
 * Optionally register core servers via `claude mcp add --scope project` when
 * the CLI is present. Best-effort only — project `.mcp.json` is preferred.
 * Never hangs on interactive prompts: failures become a soft skip.
 *
 * @param cwd - Project directory.
 * @param core - Core catalog servers (stdio only; remotes skipped).
 * @param deps - Spawn + command probe.
 * @returns Names successfully registered via CLI, if any.
 * @example
 * const names = tryClaudeMcpAdd(process.cwd(), core, deps);
 */
export const tryClaudeMcpAdd = (
  cwd: string,
  core: readonly McpCatalogServer[],
  deps: Pick<McpWireDeps, 'commandExists' | 'spawn'>,
): readonly string[] => {
  if (!deps.commandExists('claude')) {
    return [];
  }
  const registered: string[] = [];
  for (const server of core) {
    if (server.command.trim().startsWith('remote:')) {
      continue;
    }
    const { command, args } = splitCatalogCommand(server.command);
    if (command === '') {
      continue;
    }
    // claude mcp add <name> --scope project -- <command> [args...]
    const mcpAdd = deps.spawn(
      'claude',
      ['mcp', 'add', server.name, '--scope', 'project', '--', command, ...args],
      { cwd },
    );
    if (mcpAdd.status === 0) {
      registered.push(server.name);
    }
  }
  return registered;
};

/**
 * Wire curated core assistant tools into project configs for MCP-capable agents.
 *
 * Project-scoped only: Cursor → `.cursor/mcp.json`, Claude Code → `.mcp.json`.
 * Codex / Gemini (`mcpSupported: false`) are skipped. No-op when the project
 * has no catalog (pre-create doctor). Optional failures are warnings; secrets
 * are never written.
 *
 * @param cwd - Project directory.
 * @param agents - Detected agents for this machine/project.
 * @param deps - Injectable I/O.
 * @returns Buyer-facing lines and wire status (never says "MCP").
 */
export const wireCoreMcps = (
  cwd: string,
  agents: readonly DetectedAgent[],
  deps: McpWireDeps = createDefaultMcpWireDeps(),
): McpWireResult => {
  const core = loadCoreMcpServers(cwd, deps);
  const coreServerNames = core.map((server) => server.name);

  if (core.length === 0) {
    return {
      ok: true,
      wired: false,
      coreServerNames: [],
      agentsWired: [],
      lines: [],
    };
  }

  const capable = agents.filter((agent) => agent.mcpSupported);
  if (capable.length === 0) {
    return {
      ok: true,
      wired: false,
      coreServerNames,
      agentsWired: [],
      lines: [
        '→ assistant tools - your detected assistant does not use project tool plug-ins yet; official docs fallback still works.',
      ],
    };
  }

  const lines: string[] = [];
  const agentsWired: AgentId[] = [];
  const coreLabel = coreServerNames.join(', ');
  let anyFailure = false;

  for (const agent of capable) {
    if (agent.id === 'cursor') {
      const configPath = join(cwd, '.cursor', 'mcp.json');
      try {
        const { written, added } = writeMergedMcpConfig(configPath, core, deps);
        agentsWired.push('cursor');
        if (written && added.length > 0) {
          lines.push(`✓ assistant tools - Cursor project tools ready (core: ${coreLabel}).`);
        } else {
          lines.push(`✓ assistant tools - Cursor already has core tools (core: ${coreLabel}).`);
        }
      } catch {
        anyFailure = true;
        lines.push(
          '→ assistant tools - could not update Cursor project tools. Re-run doctor after the project files are in place.',
        );
      }
      continue;
    }

    if (agent.id === 'claude-code') {
      const configPath = join(cwd, '.mcp.json');
      try {
        const { written, added } = writeMergedMcpConfig(configPath, core, deps);
        // Project `.mcp.json` is preferred. Optional CLI register is best-effort only
        // (deps.spawn uses a short timeout + CI env so it cannot hang).
        if (written && added.length > 0) {
          tryClaudeMcpAdd(cwd, core, deps);
        }
        agentsWired.push('claude-code');
        if (written && added.length > 0) {
          lines.push(`✓ assistant tools - Claude Code project tools ready (core: ${coreLabel}).`);
        } else {
          lines.push(
            `✓ assistant tools - Claude Code already has core tools (core: ${coreLabel}).`,
          );
        }
      } catch {
        anyFailure = true;
        lines.push(
          '→ assistant tools - could not update Claude Code project tools. Re-run doctor after the project files are in place.',
        );
      }
    }
  }

  if (agentsWired.length > 0) {
    lines.push(
      '  Your agent uses these from the project catalog; secrets stay in env / sign-in, never committed.',
    );
  }

  return {
    ok: !anyFailure,
    wired: agentsWired.length > 0,
    coreServerNames,
    agentsWired,
    lines,
  };
};
