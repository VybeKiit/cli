import { describe, expect, it } from 'vitest';
import {
  type AgentExperienceDeps,
  detectPresentAgents,
  runAgentExperience,
} from '../src/doctor/agentExperience';

const CORE_CATALOG_JSON = JSON.stringify({
  servers: [
    {
      name: 'context7',
      category: 'core',
      priority: 1,
      command: 'npx -y @upstash/context7-mcp@latest',
      env: [],
    },
    {
      name: 'github',
      category: 'core',
      priority: 1,
      command: 'npx -y @modelcontextprotocol/server-github',
      env: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    },
  ],
});

const baseDeps = (overrides: Partial<AgentExperienceDeps> = {}): AgentExperienceDeps => ({
  commandExists: () => false,
  pathExists: () => false,
  env: {},
  ensureProjectSkillLinks: async () => undefined,
  ...overrides,
});

describe('detectPresentAgents', () => {
  it('defaults to Claude Code when nothing is present', () => {
    const agents = detectPresentAgents('/tmp/empty', baseDeps());
    expect(agents.map((a) => a.id)).toEqual(['claude-code']);
  });

  it('detects Cursor from session env', () => {
    const agents = detectPresentAgents('/tmp/empty', baseDeps({ env: { CURSOR_TRACE_ID: 'abc' } }));
    expect(agents.some((a) => a.id === 'cursor')).toBe(true);
  });

  it('detects multiple agents from PATH and project markers', () => {
    const agents = detectPresentAgents(
      '/proj',
      baseDeps({
        commandExists: (cmd) => cmd === 'claude' || cmd === 'codex',
        pathExists: (path) => path.includes('/proj/.cursor'),
        env: {},
      }),
    );
    const ids = agents.map((a) => a.id);
    expect(ids).toContain('claude-code');
    expect(ids).toContain('codex');
    expect(ids).toContain('cursor');
  });
});

describe('runAgentExperience', () => {
  it('reports pre-create project skills gap without failing', async () => {
    const report = await runAgentExperience(
      '/tmp/empty',
      { skillsCliReady: true },
      baseDeps({ env: { CLAUDE_CODE: '1' } }),
    );
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.includes('agents detected'))).toBe(true);
    expect(report.lines.some((line) => line.includes('no project skill pack'))).toBe(true);
    expect(report.lines.some((line) => line.includes('After create app'))).toBe(true);
  });

  it('ensures project skill links when skills pack exists', async () => {
    let ensured = false;
    const report = await runAgentExperience(
      '/proj',
      { skillsCliReady: true },
      baseDeps({
        env: { CLAUDE_CODE: '1' },
        pathExists: (path) => path.includes('.agents/skills') || path.includes('web-perf-ci'),
        ensureProjectSkillLinks: async () => {
          ensured = true;
        },
      }),
    );
    expect(ensured).toBe(true);
    expect(report.lines.some((line) => line.includes('project skills'))).toBe(true);
    // Speed checks moved to perfReadiness.ts (ADR-0038 §8.2).
    expect(report.lines.some((line) => line.includes('speed checks'))).toBe(false);
  });

  it('wires core assistant tools for Cursor when project catalog exists', async () => {
    const files = new Map<string, string>([
      ['/proj/.claude/mcp/mcp-servers.json', CORE_CATALOG_JSON],
    ]);
    const report = await runAgentExperience(
      '/proj',
      { skillsCliReady: true },
      baseDeps({
        env: { CURSOR_TRACE_ID: 'session' },
        pathExists: (path) => files.has(path) || path.includes('/proj/.cursor'),
        mcp: {
          pathExists: (path) => files.has(path),
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
          mkdir: () => undefined,
          commandExists: () => false,
          spawn: () => ({ status: 1 }),
        },
      }),
    );
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.includes('assistant tools'))).toBe(true);
    expect(report.lines.some((line) => /MCP/i.test(line))).toBe(false);
    const cursorConfig = files.get('/proj/.cursor/mcp.json');
    expect(cursorConfig).toBeDefined();
    const parsed = JSON.parse(cursorConfig ?? '{}') as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    expect(Object.keys(parsed.mcpServers).sort()).toEqual(['context7', 'github']);
  });

  it('does not write MCP configs when only Codex is detected', async () => {
    const files = new Map<string, string>([
      ['/proj/.claude/mcp/mcp-servers.json', CORE_CATALOG_JSON],
    ]);
    const report = await runAgentExperience(
      '/proj',
      { skillsCliReady: true },
      baseDeps({
        env: { CODEX_CLI: '1' },
        pathExists: (path) => files.has(path),
        mcp: {
          pathExists: (path) => files.has(path),
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
          mkdir: () => undefined,
          commandExists: () => false,
          spawn: () => ({ status: 1 }),
        },
      }),
    );
    expect(report.ok).toBe(true);
    expect(files.has('/proj/.cursor/mcp.json')).toBe(false);
    expect(files.has('/proj/.mcp.json')).toBe(false);
    expect(report.lines.some((line) => line.includes('assistant tools'))).toBe(true);
  });
});
