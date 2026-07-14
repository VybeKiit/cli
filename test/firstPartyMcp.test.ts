import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildFirstPartyMcpConfig } from '@vybekiit/agent-kit';
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
      buildFirstPartyMcpConfig('surface'),
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
  it('writes surface + kit-root mcp configs', async () => {
    const dest = await mkdtemp(join(tmpdir(), 'vybekiit-mcp-ship-'));
    const paths = await shipFirstPartyMcpConfigs({ dest, template: 'web' });
    expect(paths).toHaveLength(4);
    const surface = JSON.parse(await readFile(paths[0] as string, 'utf8')) as {
      readonly mcpServers: { readonly vybekiit: { readonly args: readonly string[] } };
    };
    expect(surface.mcpServers.vybekiit.args[0]).toContain('../../packages/');
    const kitRoot = JSON.parse(await readFile(paths[2] as string, 'utf8')) as {
      readonly mcpServers: {
        readonly vybekiit: {
          readonly args: readonly string[];
          readonly env?: { readonly VYBEKIIT_PROJECT_ROOT?: string };
        };
      };
    };
    expect(kitRoot.mcpServers.vybekiit.args[0]).toBe('packages/agentMcp/dist/bin.js');
    expect(kitRoot.mcpServers.vybekiit.env?.VYBEKIIT_PROJECT_ROOT).toBe('templates/web');
  });
});
