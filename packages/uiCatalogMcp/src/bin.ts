#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Either, ParseResult, Schema } from 'effect';
import {
  getComponent,
  listSources,
  loadCatalog,
  searchComponents,
  suggestBlend,
  type UiCatalogIndex,
} from './catalog.js';

type ToolInputSchema = Tool['inputSchema'];

const SearchUiComponentsArgsSchema = Schema.Struct({
  query: Schema.String,
  source: Schema.optional(Schema.String),
  category: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number),
});

const GetUiComponentArgsSchema = Schema.Struct({
  source: Schema.String,
  name: Schema.String,
});

const SuggestUiBlendArgsSchema = Schema.Struct({
  intent: Schema.String,
  limit: Schema.optional(Schema.Number),
});

const searchUiComponentsInputSchema = {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Search terms, e.g. hero animated bento' },
    source: { type: 'string', description: 'Filter by namespace source id' },
    category: { type: 'string', description: 'Filter by category' },
    limit: { type: 'number', description: 'Max results (default 20)' },
  },
  required: ['query'],
  additionalProperties: false,
} satisfies ToolInputSchema;

const getUiComponentInputSchema = {
  type: 'object',
  properties: {
    source: { type: 'string', description: 'Source id, e.g. magicui, bundui, aceternity' },
    name: { type: 'string', description: 'Component slug from the catalog index' },
  },
  required: ['source', 'name'],
  additionalProperties: false,
} satisfies ToolInputSchema;

const suggestUiBlendInputSchema = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      description: 'What the builder wants, e.g. animated hero with pricing',
    },
    limit: { type: 'number', description: 'Max suggestions (default 10)' },
  },
  required: ['intent'],
  additionalProperties: false,
} satisfies ToolInputSchema;

const listUiSourcesInputSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} satisfies ToolInputSchema;

const tools = [
  {
    name: 'search_ui_components',
    description: 'Search mirrored UI components by keyword, source, or category.',
    inputSchema: searchUiComponentsInputSchema,
  },
  {
    name: 'get_ui_component',
    description: 'Get a mirrored component entry by source namespace and slug name.',
    inputSchema: getUiComponentInputSchema,
  },
  {
    name: 'suggest_ui_blend',
    description:
      'Given natural-language UI intent, return ranked component suggestions across mirrored sources.',
    inputSchema: suggestUiBlendInputSchema,
  },
  {
    name: 'list_ui_sources',
    description: 'List mirrored UI source namespaces and component counts.',
    inputSchema: listUiSourcesInputSchema,
  },
] satisfies readonly Tool[];

type CatalogToolHandler = (catalog: UiCatalogIndex, args: unknown) => CallToolResult;

const defaultCatalogPathSegments = [
  '..',
  '..',
  '..',
  'templates',
  'web',
  '.vybekiit',
  'agent',
  'ui-catalog-index.json',
] as const;

/**
 * Resolve the catalog index path for this MCP server.
 *
 * @returns The env override, or the default mirrored web catalog path.
 * @example
 * const path = resolveCatalogPath();
 */
const resolveCatalogPath = (): string => {
  if (process.env.VYBEKIIT_UI_CATALOG_PATH !== undefined) {
    return process.env.VYBEKIIT_UI_CATALOG_PATH;
  }
  return new URL(defaultCatalogPathSegments.join('/'), import.meta.url).pathname;
};

/**
 * Load and decode the UI catalog index from disk.
 *
 * @returns The validated UI catalog index.
 * @example
 * const catalog = await readCatalog();
 */
const readCatalog = async (): Promise<UiCatalogIndex> => {
  const catalogPath = resolveCatalogPath();
  const json = await readFile(catalogPath, 'utf8');
  return loadCatalog(json);
};

/**
 * Encode an MCP tool response as formatted JSON text.
 *
 * @param value - Tool response payload.
 * @returns A text MCP tool result.
 * @example
 * const result = jsonText({ ok: true });
 */
const jsonText = (value: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

/**
 * Encode an MCP tool error as plain text.
 *
 * @param message - Error message to return to the MCP client.
 * @returns An error MCP tool result.
 * @example
 * const result = errorText('Not found');
 */
const errorText = (message: string): CallToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
});

/**
 * Decode MCP tool arguments with an Effect Schema.
 *
 * @param schema - Schema for the tool arguments.
 * @param toolName - Tool name used in validation errors.
 * @param args - Unknown MCP arguments payload.
 * @returns Decoded tool arguments.
 * @throws McpError when the arguments do not match the schema.
 * @example
 * const params = decodeToolArgs(SearchUiComponentsArgsSchema, 'search_ui_components', args);
 */
const decodeToolArgs = <A, I>(
  schema: Schema.Schema<A, I, never>,
  toolName: string,
  args: unknown,
): A => {
  const parsed = Schema.decodeUnknownEither(schema)(args);
  if (Either.isRight(parsed)) {
    return parsed.right;
  }
  throw new McpError(
    ErrorCode.InvalidParams,
    `Invalid arguments for ${toolName}: ${ParseResult.TreeFormatter.formatErrorSync(parsed.left)}`,
  );
};

/**
 * Run the search UI components MCP tool.
 *
 * @param catalog - Loaded UI catalog index.
 * @param args - Unknown MCP arguments payload.
 * @returns The MCP tool result.
 * @example
 * const result = handleSearchUiComponents(catalog, { query: 'hero' });
 */
const handleSearchUiComponents = (catalog: UiCatalogIndex, args: unknown): CallToolResult => {
  const params = decodeToolArgs(SearchUiComponentsArgsSchema, 'search_ui_components', args);
  const results = searchComponents(catalog, params.query, {
    ...(params.source === undefined ? {} : { source: params.source }),
    ...(params.category === undefined ? {} : { category: params.category }),
    ...(params.limit === undefined ? {} : { limit: params.limit }),
  });
  return jsonText(results);
};

/**
 * Run the get UI component MCP tool.
 *
 * @param catalog - Loaded UI catalog index.
 * @param args - Unknown MCP arguments payload.
 * @returns The MCP tool result.
 * @example
 * const result = handleGetUiComponent(catalog, { source: 'magicui', name: 'marquee' });
 */
const handleGetUiComponent = (catalog: UiCatalogIndex, args: unknown): CallToolResult => {
  const params = decodeToolArgs(GetUiComponentArgsSchema, 'get_ui_component', args);
  const component = getComponent(catalog, params.source, params.name);
  if (component === undefined) {
    return errorText(`Not found: ${params.source}/${params.name}`);
  }
  return jsonText(component);
};

/**
 * Run the suggest UI blend MCP tool.
 *
 * @param catalog - Loaded UI catalog index.
 * @param args - Unknown MCP arguments payload.
 * @returns The MCP tool result.
 * @example
 * const result = handleSuggestUiBlend(catalog, { intent: 'animated hero' });
 */
const handleSuggestUiBlend = (catalog: UiCatalogIndex, args: unknown): CallToolResult => {
  const params = decodeToolArgs(SuggestUiBlendArgsSchema, 'suggest_ui_blend', args);
  return jsonText(suggestBlend(catalog, params.intent, params.limit));
};

/**
 * Run the list UI sources MCP tool.
 *
 * @param catalog - Loaded UI catalog index.
 * @returns The MCP tool result.
 * @example
 * const result = handleListUiSources(catalog, {});
 */
const handleListUiSources = (catalog: UiCatalogIndex): CallToolResult =>
  jsonText(listSources(catalog));

const catalogToolHandlers: Record<string, CatalogToolHandler> = {
  search_ui_components: handleSearchUiComponents,
  get_ui_component: handleGetUiComponent,
  suggest_ui_blend: handleSuggestUiBlend,
  list_ui_sources: handleListUiSources,
};

/**
 * Dispatch one MCP tool call against a loaded catalog.
 *
 * @param catalog - Loaded UI catalog index.
 * @param toolName - MCP tool name to run.
 * @param args - Unknown MCP arguments payload.
 * @returns The MCP tool result.
 * @throws McpError when the tool name is unknown or arguments are invalid.
 * @example
 * const result = callCatalogTool(catalog, 'list_ui_sources', {});
 */
const callCatalogTool = (
  catalog: UiCatalogIndex,
  toolName: string,
  args: unknown,
): CallToolResult => {
  const handler = catalogToolHandlers[toolName];
  if (handler === undefined) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
  }
  return handler(catalog, args);
};

/**
 * Start the UI catalog MCP server over stdio.
 *
 * @returns A promise that resolves when the server is connected.
 * @example
 * await main();
 */
const main = async (): Promise<void> => {
  const catalog = await readCatalog();
  const server = new Server(
    {
      name: 'vybekiit-ui-catalog',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, (request) =>
    callCatalogTool(catalog, request.params.name, request.params.arguments),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

/**
 * Convert an unknown fatal error into stderr output and exit.
 *
 * @param error - Unknown error rejected from {@link main}.
 * @returns Never returns because the process exits.
 * @example
 * main().catch(reportFatalError);
 */
const reportFatalError = (error: unknown): never => {
  let message = String(error);
  if (error instanceof Error) {
    message = error.stack === undefined ? error.message : error.stack;
  }
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

main().catch(reportFatalError);
