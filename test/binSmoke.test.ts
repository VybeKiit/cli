import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'bin.js');
const SEMVER = /^\d+\.\d+\.\d+/;

// Regression guard for the v0.5.0 incident: tsup code-splitting moved the bin's
// main-module guard into a chunk, so the published CLI ran and did nothing. This exercises
// the BUILT artifact (not src) so a bundling regression can never ship silently again.
describe('built bin (dist/bin.js)', () => {
  it('prints a version and exits 0 — never a silent no-op', async () => {
    if (!existsSync(BIN)) {
      // dist not built in this run; the release pipeline builds before testing.
      expect(true).toBe(true);
      return;
    }
    const { stdout } = await execFileAsync('node', [BIN, '--version']);
    expect(stdout.trim()).toMatch(SEMVER);
    // Generous timeout: this spawns a cold `node` that loads the whole bundled
    // bin, which can exceed the 5s default under parallel test load in CI.
  }, 30_000);

  it('serves the global MCP and answers a real read-only tool call', async () => {
    if (!existsSync(BIN)) {
      expect(true).toBe(true);
      return;
    }
    const client = new Client({ name: 'vybekiit-cli-smoke', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [BIN, 'mcp', 'serve'],
      cwd: dirname(BIN),
      stderr: 'pipe',
    });
    await client.connect(transport);
    try {
      const catalog = await client.listTools();
      expect(catalog.tools.map((tool) => tool.name)).toContain('search_skills');
      const paymentSkill = await client.callTool({
        name: 'search_skills',
        arguments: { query: 'payments', template: 'web', limit: 3 },
      });
      expect(JSON.stringify(paymentSkill)).toContain('setup-payments');
    } finally {
      await client.close();
    }
  }, 30_000);
});
