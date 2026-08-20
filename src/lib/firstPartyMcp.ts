import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type FirstPartyMcpPathLayout,
  type FirstPartyMcpServersConfig,
  firstPartyMcpConfig,
  formatFirstPartyMcpConfigJson,
} from '@vybekiit/agent-kit';

/** Parsed project MCP config with optional env on stdio entries. */
export type ProjectMcpServersConfig = {
  readonly mcpServers: Readonly<
    Record<
      string,
      | {
          readonly command: string;
          readonly args: readonly string[];
          readonly env?: Readonly<Record<string, string>>;
        }
      | { readonly url: string }
    >
  >;
};

/**
 * Parse project MCP JSON; invalid/missing shape yields empty servers.
 *
 * @param raw - File text.
 * @returns Normalized config.
 */
export const parseProjectMcpConfig = (raw: string): ProjectMcpServersConfig => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
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
  const mcpServers: Record<string, ProjectMcpServersConfig['mcpServers'][string]> = {};
  for (const [name, value] of Object.entries(servers as Record<string, unknown>)) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.url === 'string' && record.url !== '') {
      mcpServers[name] = { url: record.url };
      continue;
    }
    if (typeof record.command === 'string' && record.command !== '') {
      const args = Array.isArray(record.args)
        ? record.args.filter((item): item is string => typeof item === 'string')
        : [];
      const envRaw = record.env;
      let env: Record<string, string> | undefined;
      if (envRaw !== null && typeof envRaw === 'object' && !Array.isArray(envRaw)) {
        env = {};
        for (const [key, envValue] of Object.entries(envRaw as Record<string, unknown>)) {
          if (typeof envValue === 'string') {
            env[key] = envValue;
          }
        }
      }
      mcpServers[name] =
        env === undefined
          ? { command: record.command, args }
          : { command: record.command, args, env };
    }
  }
  return { mcpServers };
};

/**
 * Merge first-party servers into an existing project config without clobbering
 * other servers. Overwrites first-party keys so paths stay correct after scaffold.
 *
 * @param existing - Existing project config.
 * @param firstParty - First-party fragment from {@link firstPartyMcpConfig}.
 * @returns Merged config and names written/updated.
 */
export const mergeFirstPartyMcpServers = (
  existing: ProjectMcpServersConfig,
  firstParty: FirstPartyMcpServersConfig,
): { readonly config: ProjectMcpServersConfig; readonly written: readonly string[] } => {
  const next: Record<string, ProjectMcpServersConfig['mcpServers'][string]> = {
    ...existing.mcpServers,
  };
  const written: string[] = [];
  for (const [name, entry] of Object.entries(firstParty.mcpServers)) {
    next[name] = entry;
    written.push(name);
  }
  return { config: { mcpServers: next }, written };
};

/**
 * Write first-party MCP servers into a project config file (create or merge).
 *
 * @param configPath - Absolute path to `.cursor/mcp.json` or `.mcp.json`.
 * @param layout - Path layout for bin resolution.
 * @param options - Optional template for kit-root project root.
 * @returns Names of first-party servers written.
 */
export const writeFirstPartyMcpConfigFile = async (
  configPath: string,
  layout: FirstPartyMcpPathLayout,
  options?: { readonly template?: string },
): Promise<readonly string[]> => {
  const firstParty = firstPartyMcpConfig(layout, options);
  let existing: ProjectMcpServersConfig = { mcpServers: {} };
  try {
    existing = parseProjectMcpConfig(await readFile(configPath, 'utf8'));
  } catch {
    existing = { mcpServers: {} };
  }
  const { config, written } = mergeFirstPartyMcpServers(existing, firstParty);
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, formatFirstPartyMcpConfigJson(config));
  return written;
};

/** Remove the obsolete Claude project entry without touching other project servers. */
const removeProjectVybekiitMcp = async (configPath: string): Promise<boolean> => {
  let existingText: string;
  try {
    existingText = await readFile(configPath, 'utf8');
  } catch {
    return false;
  }
  const existing = parseProjectMcpConfig(existingText);
  if (existing.mcpServers.vybekiit === undefined) {
    return false;
  }
  const mcpServers = Object.fromEntries(
    Object.entries(existing.mcpServers).filter(([name]) => name !== 'vybekiit'),
  );
  await writeFile(configPath, formatFirstPartyMcpConfigJson({ mcpServers }));
  return true;
};

/**
 * Write Cursor first-party MCP project configs after scaffold.
 * Claude receives the same server once at user scope from `vybekiit setup`.
 *
 * @param options - Kit dest root and surface template name.
 * @returns Absolute paths written.
 */
export const shipFirstPartyMcpConfigs = async (options: {
  readonly dest: string;
  readonly template: string;
}): Promise<readonly string[]> => {
  const surfaceDir = join(options.dest, 'templates', options.template);
  const paths = [
    join(surfaceDir, '.cursor', 'mcp.json'),
    join(options.dest, '.cursor', 'mcp.json'),
  ];
  const obsoleteClaudePaths = [join(surfaceDir, '.mcp.json'), join(options.dest, '.mcp.json')];

  await writeFirstPartyMcpConfigFile(paths[0] as string, 'surface');
  await writeFirstPartyMcpConfigFile(paths[1] as string, 'kit-root', {
    template: options.template,
  });
  await Promise.all(obsoleteClaudePaths.map(removeProjectVybekiitMcp));

  return paths;
};
