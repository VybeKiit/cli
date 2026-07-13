import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sampleCatalog = {
  version: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  componentCount: 2,
  sources: { magicui: 1, aceternity: 1 },
  components: [
    {
      source: 'magicui',
      name: 'marquee',
      paths: ['src/components/magicui/marquee.tsx'],
      dependencies: ['motion'],
      tags: ['animated', 'marketing'],
      portable: false,
      category: 'component',
    },
    {
      source: 'aceternity',
      name: 'hero-parallax',
      paths: ['src/components/aceternity/hero-parallax.tsx'],
      dependencies: ['motion'],
      tags: ['hero', 'animated'],
      portable: false,
      category: 'hero',
    },
  ],
};

/** Re-import the server module with a fresh, uncached lazy catalog for each test. */
const loadServer = async () => {
  vi.resetModules();
  return import('./server.js');
};

/** Read the first text block from an MCP tool result. */
const textOf = (result: CallToolResult): string => {
  const first = result.content[0];
  if (first === undefined || first.type !== 'text') {
    throw new Error('expected a text content block');
  }
  return first.text;
};

describe('vybekiit MCP server (merged agent + UI catalog)', () => {
  const prevCatalogPath = process.env.VYBEKIIT_UI_CATALOG_PATH;

  afterEach(() => {
    if (prevCatalogPath === undefined) {
      delete process.env.VYBEKIIT_UI_CATALOG_PATH;
    } else {
      process.env.VYBEKIIT_UI_CATALOG_PATH = prevCatalogPath;
    }
  });

  it('lists all 15 tools on one server, including the 4 UI catalog tools', async () => {
    const { tools } = await loadServer();
    const names = tools.map((tool) => tool.name);
    expect(tools).toHaveLength(15);
    expect(names).toEqual(
      expect.arrayContaining([
        'search_skills',
        'get_skill',
        'list_platform_skills',
        'search_commands',
        'get_command',
        'search_doctor_tools',
        'search_tech_ids',
        'doc_fallback',
        'search_automations',
        'get_automation',
        'run_automation',
        'search_ui_components',
        'get_ui_component',
        'suggest_ui_blend',
        'list_ui_sources',
      ]),
    );
  });

  it('serves UI catalog tools from the merged server when the index is present', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vybekiit-catalog-'));
    const catalogPath = join(dir, 'ui-catalog-index.json');
    await writeFile(catalogPath, JSON.stringify(sampleCatalog), 'utf8');
    process.env.VYBEKIIT_UI_CATALOG_PATH = catalogPath;

    const { callTool } = await loadServer();
    const result = await callTool('search_ui_components', { query: 'hero' });

    expect(result.isError).toBeUndefined();
    const payload = JSON.parse(textOf(result)) as { items: Array<{ name: string }> };
    expect(payload.items[0]?.name).toBe('hero-parallax');

    await rm(dir, { recursive: true, force: true });
  });

  it('isolates a missing UI catalog: UI tool errors, agent tools keep working', async () => {
    process.env.VYBEKIIT_UI_CATALOG_PATH = join(tmpdir(), 'vybekiit-missing', 'nope.json');
    const { callTool } = await loadServer();

    const uiResult = await callTool('list_ui_sources', {});
    expect(uiResult.isError).toBe(true);
    expect(textOf(uiResult)).toContain('UI catalog unavailable');

    // Fault isolation: a broken catalog path must not break the agent surface.
    const commandResult = await callTool('search_commands', { query: 'doctor' });
    expect(commandResult.isError).toBeUndefined();
  });

  it('rejects an unknown tool name', async () => {
    const { callTool } = await loadServer();
    await expect(callTool('not_a_tool', {})).rejects.toThrow(/Unknown tool/);
  });
});
