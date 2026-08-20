import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { firstPartyMcpConfig } from '@vybekiit/agent-kit';
import { describe, expect, it } from 'vitest';
import {
  mergeFirstPartyMcpServers,
  parseProjectMcpConfig,
  shipFirstPartyMcpConfigs,
} from '../src/lib/firstPartyMcp';

describe('parseProjectMcpConfig', () => {
  it('preserves stdio env maps', () => {
    const config = parseProjectMcpConfig(
      JSON.stringify({
        mcpServers: {
          vybekiit: {
            command: 'node',
            args: ['packages/agentMcp/dist/bin.js'],
            env: { VYBEKIIT_PROJECT_ROOT: '.' },
          },
        },
      }),
    );
    const entry = config.mcpServers.vybekiit;
    expect(entry).toBeDefined();
    if (entry !== undefined && 'command' in entry) {
      expect(entry.env?.VYBEKIIT_PROJECT_ROOT).toBe('.');
    }
  });
});

describe('mergeFirstPartyMcpServers', () => {
  it('keeps third-party servers and overwrites first-party paths', () => {
    const { config, written } = mergeFirstPartyMcpServers(
      {
        mcpServers: {
          context7: { command: 'npx', args: ['-y', 'context7'] },
          vybekiit: { command: 'node', args: ['old/path.js'] },
        },
      },
      firstPartyMcpConfig('surface'),
    );
    expect(written).toContain('vybekiit');
    expect(config.mcpServers.context7).toEqual({ command: 'npx', args: ['-y', 'context7'] });
    const vybekiit = config.mcpServers.vybekiit;
    expect(vybekiit !== undefined && 'args' in vybekiit && vybekiit.args[0]).toContain(
      'agentMcp/dist/bin.js',
    );
  });
});

describe('shipFirstPartyMcpConfigs', () => {
  it('writes Cursor configs without creating Claude project-scoped duplicates', async () => {
    const dest = await mkdtemp(join(tmpdir(), 'vybekiit-mcp-ship-'));
    const paths = await shipFirstPartyMcpConfigs({ dest, template: 'web' });
    expect(paths).toHaveLength(2);
    const surface = JSON.parse(await readFile(paths[0] as string, 'utf8')) as {
      readonly mcpServers: { readonly vybekiit: { readonly args: readonly string[] } };
    };
    expect(surface.mcpServers.vybekiit.args[0]).toContain('../../packages/');
    const kitRoot = JSON.parse(await readFile(paths[1] as string, 'utf8')) as {
      readonly mcpServers: {
        readonly vybekiit: {
          readonly args: readonly string[];
          readonly env?: { readonly VYBEKIIT_PROJECT_ROOT?: string };
        };
      };
    };
    expect(kitRoot.mcpServers.vybekiit.args[0]).toBe('packages/agentMcp/dist/bin.js');
    expect(kitRoot.mcpServers.vybekiit.env?.VYBEKIIT_PROJECT_ROOT).toBe('templates/web');
    await expect(readFile(join(dest, '.mcp.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(dest, 'templates', 'web', '.mcp.json'), 'utf8')).rejects.toThrow();
  });

  it('removes a stale Claude VybeKiit entry while preserving other project servers', async () => {
    const dest = await mkdtemp(join(tmpdir(), 'vybekiit-mcp-migrate-'));
    const surface = join(dest, 'templates', 'web');
    await mkdir(surface, { recursive: true });
    const stale = JSON.stringify({
      mcpServers: {
        vybekiit: { command: 'node', args: ['../../packages/agentMcp/dist/bin.js'] },
        context7: { command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] },
      },
    });
    await writeFile(join(dest, '.mcp.json'), stale);
    await writeFile(join(surface, '.mcp.json'), stale);

    await shipFirstPartyMcpConfigs({ dest, template: 'web' });

    const root = JSON.parse(await readFile(join(dest, '.mcp.json'), 'utf8')) as {
      readonly mcpServers: Readonly<Record<string, unknown>>;
    };
    const owned = JSON.parse(await readFile(join(surface, '.mcp.json'), 'utf8')) as {
      readonly mcpServers: Readonly<Record<string, unknown>>;
    };
    expect(root.mcpServers.vybekiit).toBeUndefined();
    expect(root.mcpServers.context7).toBeDefined();
    expect(owned.mcpServers.vybekiit).toBeUndefined();
    expect(owned.mcpServers.context7).toBeDefined();
  });
});
