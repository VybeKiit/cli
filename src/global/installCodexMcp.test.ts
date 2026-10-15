import { it } from '@effect/vitest';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';
import type { ExecFn } from './exec';
import {
  CODEX_MCP_SERVERS,
  codexMcpAddArguments,
  codexMcpOwner,
  installCodexMcp,
} from './installCodexMcp';
import type { McpServerDef } from './installGlobalMcp';

const codexRegistration = (name: string, command: string, commandArguments: readonly string[]) => ({
  name,
  enabled: true,
  transport: { type: 'stdio', command, args: commandArguments, env: null, env_vars: [], cwd: null },
});

const codexWithRegistrations = (
  codexCalls: string[][],
  registrations: readonly ReturnType<typeof codexRegistration>[],
): ExecFn => {
  const registeredServers = new Map(
    registrations.map((registration) => [registration.name, registration]),
  );
  return (codexArguments) => {
    codexCalls.push([...codexArguments]);
    const [subcommand, action] = codexArguments;
    const serverName = codexArguments.find((codexArgument) =>
      CODEX_MCP_SERVERS.some((mcpServer) => mcpServer.name === codexArgument),
    );
    const listing = subcommand === 'mcp' && action === 'list';
    const removal = subcommand === 'mcp' && action === 'remove' && serverName !== undefined;
    if (listing) {
      const listedServers = JSON.stringify([...registeredServers.values()]);
      return Promise.resolve({ code: 0, stdout: listedServers, stderr: '' });
    }
    if (removal) {
      registeredServers.delete(serverName);
    }
    return Promise.resolve({ code: 0, stdout: 'codex-cli 0.162.1', stderr: '' });
  };
};

const missingCodex: ExecFn = () =>
  Promise.resolve({ code: 127, stdout: '', stderr: 'codex not found' });

const vybekiit: McpServerDef = {
  name: 'vybekiit',
  transport: 'stdio',
  command: ['npx', '-y', 'vybekiit@latest', 'mcp', 'serve'],
};
const playwright: McpServerDef = {
  name: 'playwright',
  transport: 'stdio',
  command: ['npx', '-y', '@playwright/mcp@latest'],
};
const github: McpServerDef = {
  name: 'github',
  transport: 'stdio',
  command: ['npx', '-y', '@modelcontextprotocol/server-github'],
  envKeys: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
};

describe('codexMcpAddArguments', () => {
  it('passes the server command after a separator', () => {
    expect(codexMcpAddArguments(playwright, {})).toEqual([
      'mcp',
      'add',
      'playwright',
      '--',
      'npx',
      '-y',
      '@playwright/mcp@latest',
    ]);
  });

  it('inlines --env flags for key-gated servers', () => {
    expect(codexMcpAddArguments(github, { GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_test' })).toEqual([
      'mcp',
      'add',
      '--env',
      'GITHUB_PERSONAL_ACCESS_TOKEN=ghp_test',
      'github',
      '--',
      'npx',
      '-y',
      '@modelcontextprotocol/server-github',
    ]);
  });
});

describe('codexMcpOwner', () => {
  it('treats a missing name as absent', () => {
    expect(codexMcpOwner(playwright, [])).toBe('absent');
  });

  it('claims a server registered exactly as VybeKiit registers it', () => {
    const registered = codexRegistration('playwright', 'npx', ['-y', '@playwright/mcp@latest']);
    expect(codexMcpOwner(playwright, [registered])).toBe('vybekiit');
  });

  it('always claims the vybekiit server and leaves a customised one to the user', () => {
    const olderKit = codexRegistration('vybekiit', 'node', ['old-kit.js']);
    const customised = codexRegistration('playwright', 'npx', ['@playwright/mcp@0.0.40']);
    expect(codexMcpOwner(vybekiit, [olderKit])).toBe('vybekiit');
    expect(codexMcpOwner(playwright, [customised])).toBe('user');
  });
});

describe('installCodexMcp', () => {
  it.effect('reports codexMissing and changes nothing when Codex is not installed', () =>
    Effect.gen(function* () {
      const codexInstallation = yield* installCodexMcp({
        codex: missingCodex,
        environment: {},
        forceRefresh: false,
      });
      expect(codexInstallation.codexMissing).toBe(true);
      expect(codexInstallation.enabled).toEqual([]);
    }),
  );

  it.effect('adds the zero-config servers and stages key-gated ones without keys', () =>
    Effect.gen(function* () {
      const codexCalls: string[][] = [];
      const codex = codexWithRegistrations(codexCalls, []);
      const codexInstallation = yield* installCodexMcp({
        codex,
        environment: {},
        forceRefresh: false,
      });
      expect(codexInstallation.enabled).toEqual(['vybekiit', 'playwright', 'context7']);
      expect(codexInstallation.needsKey).toContain('github');
      expect(codexInstallation.codexMissing).toBe(false);
      expect(codexCalls).toContainEqual(['mcp', 'list', '--json']);
      expect(codexCalls).toContainEqual([
        'mcp',
        'add',
        'vybekiit',
        '--',
        'npx',
        '-y',
        'vybekiit@latest',
        'mcp',
        'serve',
      ]);
    }),
  );

  it.effect('keeps present servers and refreshes zero-config ones on a re-run', () =>
    Effect.gen(function* () {
      const registrations = [
        codexRegistration('vybekiit', 'npx', ['-y', 'vybekiit@latest', 'mcp', 'serve']),
        codexRegistration('playwright', 'npx', ['@playwright/mcp@0.0.40']),
      ];
      const firstRunCalls: string[][] = [];
      const firstRun = yield* installCodexMcp({
        codex: codexWithRegistrations(firstRunCalls, registrations),
        environment: {},
        forceRefresh: false,
      });
      expect(firstRun.alreadyPresent).toEqual(['vybekiit', 'playwright']);
      expect(firstRun.enabled).toEqual(['context7']);
      expect(firstRunCalls.filter(([, action]) => action === 'add')).toHaveLength(1);

      const reRun = yield* installCodexMcp({
        codex: codexWithRegistrations([], registrations),
        environment: {},
        forceRefresh: true,
      });
      expect(reRun.refreshed).toEqual(['vybekiit', 'playwright']);
      expect(reRun.enabled).toEqual(['context7']);
    }),
  );

  it.effect('registers a key-gated server when its token is present', () =>
    Effect.gen(function* () {
      const codexCalls: string[][] = [];
      const codexInstallation = yield* installCodexMcp({
        codex: codexWithRegistrations(codexCalls, []),
        environment: { STRIPE_SECRET_KEY: 'sk_test_key' },
        forceRefresh: false,
      });
      expect(codexInstallation.enabled).toContain('stripe');
      expect(codexCalls).toContainEqual([
        'mcp',
        'add',
        '--env',
        'STRIPE_SECRET_KEY=sk_test_key',
        'stripe',
        '--',
        'npx',
        '-y',
        '@stripe/mcp',
        '--tools=all',
      ]);
    }),
  );

  it.effect('writes nothing when Codex cannot list its servers', () =>
    Effect.gen(function* () {
      const codexCalls: string[][] = [];
      const olderCodex: ExecFn = (codexArguments) => {
        codexCalls.push([...codexArguments]);
        const versionCheck = codexArguments[0] === '--version';
        return Promise.resolve(
          versionCheck
            ? { code: 0, stdout: 'codex-cli 0.1.0', stderr: '' }
            : { code: 2, stdout: '', stderr: "unexpected argument '--json'" },
        );
      };
      const codexInstallation = yield* installCodexMcp({
        codex: olderCodex,
        environment: {},
        forceRefresh: false,
      });
      expect(codexInstallation.failed).toEqual(['vybekiit', 'playwright', 'context7']);
      expect(codexCalls.filter(([, action]) => action === 'add')).toEqual([]);
    }),
  );
});
