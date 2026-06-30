#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  getComponent,
  listSources,
  loadCatalog,
  searchComponents,
  suggestBlend,
  type UiCatalogIndex,
} from './catalog.js';

async function readCatalog(): Promise<UiCatalogIndex> {
  const catalogPath =
    process.env.VYBEKIIT_UI_CATALOG_PATH ??
    new URL('../../../templates/web/.vybekiit/agent/ui-catalog-index.json', import.meta.url)
      .pathname;
  const json = await readFile(catalogPath, 'utf8');
  return loadCatalog(json);
}

async function main() {
  const catalog = await readCatalog();
  const server = new McpServer({
    name: 'vybekiit-ui-catalog',
    version: '0.1.0',
  });

  server.tool(
    'search_ui_components',
    'Search mirrored UI components by keyword, source, or category.',
    {
      query: z.string().describe('Search terms, e.g. hero animated bento'),
      source: z.string().optional().describe('Filter by namespace source id'),
      category: z.string().optional().describe('Filter by category'),
      limit: z.number().optional().describe('Max results (default 20)'),
    },
    async ({ query, source, category, limit }) => {
      const results = searchComponents(catalog, query, {
        ...(source === undefined ? {} : { source }),
        ...(category === undefined ? {} : { category }),
        ...(limit === undefined ? {} : { limit }),
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    },
  );

  server.tool(
    'get_ui_component',
    'Get a mirrored component entry by source namespace and slug name.',
    {
      source: z.string().describe('Source id, e.g. magicui, bundui, aceternity'),
      name: z.string().describe('Component slug from the catalog index'),
    },
    async ({ source, name }) => {
      const component = getComponent(catalog, source, name);
      if (!component) {
        return {
          content: [{ type: 'text', text: `Not found: ${source}/${name}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(component, null, 2) }],
      };
    },
  );

  server.tool(
    'suggest_ui_blend',
    'Given natural-language UI intent, return ranked component suggestions across mirrored sources.',
    {
      intent: z.string().describe('What the builder wants, e.g. animated hero with pricing'),
      limit: z.number().optional().describe('Max suggestions (default 10)'),
    },
    async ({ intent, limit }) => {
      const suggestions = suggestBlend(catalog, intent, limit);
      return {
        content: [{ type: 'text', text: JSON.stringify(suggestions, null, 2) }],
      };
    },
  );

  server.tool(
    'list_ui_sources',
    'List mirrored UI source namespaces and component counts.',
    {},
    async () => ({
      content: [{ type: 'text', text: JSON.stringify(listSources(catalog), null, 2) }],
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
