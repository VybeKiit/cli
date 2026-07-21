import { describe, expect, it } from 'vitest';
import {
  buildMcpServersConfig,
  catalogServerToMcpEntry,
  type McpCatalogServer,
  type McpWireDeps,
  mergeCoreMcpServers,
  parseMcpCatalog,
  selectCoreMcpServers,
  splitCatalogCommand,
  wireCoreMcps,
} from '../../src/doctor/mcpWire';
import { getAgentById } from '../../src/lib/agentDetection';

/** Minimal real core rows matching templates/web/.claude/mcp/mcp-servers.json. */
const CORE_CATALOG_JSON = JSON.stringify({
  servers: [
    {
      name: 'context7',
      description: 'Version-specific library docs',
      category: 'core',
      priority: 1,
      command: 'npx -y @upstash/context7-mcp@latest',
      env: [],
    },
    {
      name: 'github',
      description: 'PR review, issue triage',
      category: 'core',
      priority: 1,
      command: 'npx -y @modelcontextprotocol/server-github',
      env: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    },
    {
      name: 'playwright',
      category: 'frontend',
      priority: 2,
      command: 'npx -y @playwright/mcp@latest',
      env: [],
    },
  ],
});

const memoryDeps = (options: {
  readonly files?: Map<string, string>;
  readonly commands?: ReadonlySet<string>;
}): McpWireDeps & { readonly files: Map<string, string> } => {
  const files = options.files ?? new Map<string, string>();
  const commands = options.commands ?? new Set<string>();
  const dirs = new Set<string>();
  return {
    files,
    pathExists: (path) => files.has(path) || dirs.has(path),
    readFile: (path) => {
      const content = files.get(path);
      if (content === undefined) {
        throw new Error(`ENOENT: ${path}`);
      }
      return content;
    },
    writeFile: (path, content) => {
      files.set(path, content);
    },
    mkdir: (path) => {
      dirs.add(path);
    },
    commandExists: (command) => commands.has(command),
    spawn: () => ({ status: 1 }),
  };
};

describe('parseMcpCatalog / selectCoreMcpServers', () => {
  it('parses catalog and keeps only core / priority-1 servers', () => {
    const servers = parseMcpCatalog(CORE_CATALOG_JSON);
    expect(servers.map((s) => s.name)).toEqual(['context7', 'github', 'playwright']);
    const core = selectCoreMcpServers(servers);
    expect(core.map((s) => s.name)).toEqual(['context7', 'github']);
  });

  it('returns empty for invalid JSON', () => {
    expect(parseMcpCatalog('{not json')).toEqual([]);
  });
});

describe('splitCatalogCommand / catalogServerToMcpEntry', () => {
  it('splits npx catalog commands into command + args', () => {
    expect(splitCatalogCommand('npx -y @upstash/context7-mcp@latest')).toEqual({
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@latest'],
    });
  });

  it('maps remote catalog commands to url entries', () => {
    const entry = catalogServerToMcpEntry({
      name: 'sentry',
      command: 'remote:https://mcp.sentry.dev/sse',
    });
    expect(entry).toEqual({ url: 'https://mcp.sentry.dev/sse' });
  });

  it('builds Cursor-shaped mcpServers without inventing packages', () => {
    const core = selectCoreMcpServers(parseMcpCatalog(CORE_CATALOG_JSON));
    const config = buildMcpServersConfig(core);
    expect(config.mcpServers.context7).toEqual({
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@latest'],
    });
    expect(config.mcpServers.github).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
    });
    expect(config.mcpServers.playwright).toBeUndefined();
    // Never materialize secret env values.
    expect(JSON.stringify(config)).not.toContain('GITHUB_PERSONAL_ACCESS_TOKEN');
  });
});

describe('mergeCoreMcpServers', () => {
  it('preserves existing buyer servers and only adds missing core names', () => {
    const core: readonly McpCatalogServer[] = selectCoreMcpServers(
      parseMcpCatalog(CORE_CATALOG_JSON),
    );
    const { config, added } = mergeCoreMcpServers(
      {
        mcpServers: {
          context7: { command: 'npx', args: ['-y', 'custom-context7'] },
          bridge: { command: 'bridge', args: ['serve'] },
        },
      },
      core,
    );
    expect(added).toEqual(['github']);
    expect(config.mcpServers.context7).toEqual({
      command: 'npx',
      args: ['-y', 'custom-context7'],
    });
    expect(config.mcpServers.bridge).toEqual({ command: 'bridge', args: ['serve'] });
    expect(config.mcpServers.github).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
    });
  });
});

describe('wireCoreMcps', () => {
  it('is a no-op without a project catalog (pre-create)', () => {
    const deps = memoryDeps({});
    const result = wireCoreMcps('/tmp/empty', [getAgentById('cursor')], deps);
    expect(result.wired).toBe(false);
    expect(result.coreServerNames).toEqual([]);
    expect(result.lines).toEqual([]);
    expect(deps.files.size).toBe(0);
  });

  it('writes .cursor/mcp.json for Cursor with real core packages only', () => {
    const catalogPath = '/proj/.claude/mcp/mcp-servers.json';
    const deps = memoryDeps({
      files: new Map([[catalogPath, CORE_CATALOG_JSON]]),
    });
    const result = wireCoreMcps('/proj', [getAgentById('cursor')], deps);
    expect(result.wired).toBe(true);
    expect(result.agentsWired).toEqual(['cursor']);
    expect(result.coreServerNames).toEqual(['context7', 'github']);
    expect(result.lines.some((line) => line.includes('assistant tools'))).toBe(true);
    expect(result.lines.some((line) => /MCP/i.test(line))).toBe(false);

    const written = deps.files.get('/proj/.cursor/mcp.json');
    expect(written).toBeDefined();
    const parsed = JSON.parse(written ?? '{}') as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    expect(Object.keys(parsed.mcpServers).sort()).toEqual(['context7', 'github']);
    const context7 = parsed.mcpServers.context7;
    const github = parsed.mcpServers.github;
    expect(context7?.args).toContain('@upstash/context7-mcp@latest');
    expect(github?.args).toContain('@modelcontextprotocol/server-github');
  });

  it('writes project .mcp.json for Claude Code', () => {
    const catalogPath = '/proj/.claude/mcp/mcp-servers.json';
    const deps = memoryDeps({
      files: new Map([[catalogPath, CORE_CATALOG_JSON]]),
      commands: new Set(),
    });
    const result = wireCoreMcps('/proj', [getAgentById('claude-code')], deps);
    expect(result.wired).toBe(true);
    expect(result.agentsWired).toEqual(['claude-code']);
    const written = deps.files.get('/proj/.mcp.json');
    expect(written).toBeDefined();
    const parsed = JSON.parse(written ?? '{}') as { mcpServers: Record<string, unknown> };
    expect(Object.keys(parsed.mcpServers).sort()).toEqual(['context7', 'github']);
  });

  it('skips Gemini and Codex (mcpSupported false)', () => {
    const catalogPath = '/proj/.claude/mcp/mcp-servers.json';
    const deps = memoryDeps({
      files: new Map([[catalogPath, CORE_CATALOG_JSON]]),
    });
    const result = wireCoreMcps('/proj', [getAgentById('gemini'), getAgentById('codex')], deps);
    expect(result.wired).toBe(false);
    expect(result.agentsWired).toEqual([]);
    expect(deps.files.has('/proj/.cursor/mcp.json')).toBe(false);
    expect(deps.files.has('/proj/.mcp.json')).toBe(false);
    expect(result.lines.some((line) => line.includes('assistant tools'))).toBe(true);
  });

  it('is idempotent when core tools already present', () => {
    const catalogPath = '/proj/.claude/mcp/mcp-servers.json';
    const existing = JSON.stringify({
      mcpServers: {
        context7: { command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] },
        github: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
      },
    });
    const deps = memoryDeps({
      files: new Map([
        [catalogPath, CORE_CATALOG_JSON],
        ['/proj/.cursor/mcp.json', existing],
      ]),
    });
    const before = deps.files.get('/proj/.cursor/mcp.json');
    const result = wireCoreMcps('/proj', [getAgentById('cursor')], deps);
    expect(result.wired).toBe(true);
    expect(result.lines.some((line) => line.includes('already has core tools'))).toBe(true);
    expect(deps.files.get('/proj/.cursor/mcp.json')).toBe(before);
  });
});
