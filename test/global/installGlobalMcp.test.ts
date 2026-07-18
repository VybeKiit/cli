import { describe, expect, it } from 'vitest';
import type { ExecResult } from '../../src/global/exec';
import {
  buildAddArgs,
  installGlobalMcp,
  type McpServerDef,
} from '../../src/global/installGlobalMcp';

const ok: ExecResult = { code: 0, stdout: '', stderr: '' };
const missing: ExecResult = { code: 1, stdout: '', stderr: '' };

describe('buildAddArgs', () => {
  it('builds stdio args with no env keys', () => {
    const def: McpServerDef = {
      name: 'context7',
      transport: 'stdio',
      command: ['npx', '-y', 'pkg'],
    };
    expect(buildAddArgs(def, {})).toEqual([
      'mcp',
      'add',
      '-s',
      'user',
      'context7',
      '--',
      'npx',
      '-y',
      'pkg',
    ]);
  });

  it('inlines -e flags for key-gated servers', () => {
    const def: McpServerDef = {
      name: 'github',
      transport: 'stdio',
      command: ['npx', 'srv'],
      envKeys: ['TOKEN'],
    };
    expect(buildAddArgs(def, { TOKEN: 'abc' })).toEqual([
      'mcp',
      'add',
      '-s',
      'user',
      '-e',
      'TOKEN=abc',
      'github',
      '--',
      'npx',
      'srv',
    ]);
  });

  it('builds sse args for remote servers', () => {
    const def: McpServerDef = { name: 'sentry', transport: 'sse', command: ['https://x/sse'] };
    expect(buildAddArgs(def, {})).toEqual([
      'mcp',
      'add',
      '-s',
      'user',
      '--transport',
      'sse',
      'sentry',
      'https://x/sse',
    ]);
  });
});

describe('installGlobalMcp', () => {
  it('reports claudeMissing when the claude binary is absent', async () => {
    const result = await installGlobalMcp({
      exec: async () => ({ code: 127, stdout: '', stderr: '' }),
      env: {},
    });
    expect(result.claudeMissing).toBe(true);
    expect(result.enabled).toEqual([]);
  });

  it('enables zero-config servers and stages key-gated ones without keys', async () => {
    const result = await installGlobalMcp({
      exec: async (args) => {
        if (args[0] === '--version') return ok;
        if (args[1] === 'get') return missing; // nothing registered yet
        return ok; // add succeeds
      },
      env: {},
    });
    expect(result.enabled).toEqual(expect.arrayContaining(['playwright', 'context7', 'sentry']));
    expect(result.needsKey).toContain('github');
    expect(result.claudeMissing).toBe(false);
  });

  it('skips servers that are already registered', async () => {
    const result = await installGlobalMcp({
      exec: async (args) => {
        if (args[0] === '--version') return ok;
        if (args[1] === 'get') return ok; // already present
        return ok;
      },
      env: {},
    });
    expect(result.alreadyPresent).toContain('playwright');
    expect(result.enabled).not.toContain('playwright');
    expect(result.refreshed).toEqual([]);
  });

  it('force-refreshes zero-config servers on auto-update re-runs', async () => {
    const calls: string[][] = [];
    const result = await installGlobalMcp({
      exec: async (args) => {
        calls.push([...args]);
        if (args[0] === '--version') return ok;
        if (args[1] === 'get') return ok; // already present
        return ok; // remove + add succeed
      },
      env: {},
      forceRefresh: true,
    });
    expect(result.refreshed).toEqual(expect.arrayContaining(['playwright', 'context7', 'sentry']));
    expect(result.alreadyPresent).not.toContain('playwright');
    expect(calls.some((args) => args[0] === 'mcp' && args[1] === 'remove')).toBe(true);
  });

  it('registers a key-gated server when its token is present', async () => {
    const result = await installGlobalMcp({
      exec: async (args) => {
        if (args[0] === '--version') return ok;
        if (args[1] === 'get') return missing;
        return ok;
      },
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_x' },
    });
    expect(result.enabled).toContain('github');
    expect(result.needsKey).not.toContain('github');
  });
});
