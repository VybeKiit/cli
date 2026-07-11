#!/usr/bin/env node
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
import { lookupAutomation, runAutomation, searchAutomations } from './automations.js';
import { getCommand, searchCommands } from './commands.js';
import { searchDoctorTools } from './doctorTools.js';
import { getSkill, listPlatformSkills, searchSkills } from './skills.js';
import { runDocFallback, searchTechIds } from './techSearch.js';

type ToolInputSchema = Tool['inputSchema'];

const TemplateSchema = Schema.Literal('web', 'mobile', 'extension', 'backend', 'spa');

const SearchSkillsArgsSchema = Schema.Struct({
  query: Schema.String,
  template: Schema.optional(TemplateSchema),
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String),
});

const GetSkillArgsSchema = Schema.Struct({
  id: Schema.String,
  template: Schema.optional(TemplateSchema),
  excerptLines: Schema.optional(Schema.Number),
});

const SearchCommandsArgsSchema = Schema.Struct({
  query: Schema.String,
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String),
});

const GetCommandArgsSchema = Schema.Struct({
  name: Schema.String,
});

const SearchDoctorToolsArgsSchema = Schema.Struct({
  query: Schema.String,
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String),
});

const DocFallbackArgsSchema = Schema.Struct({
  techId: Schema.String,
});

const SearchTechIdsArgsSchema = Schema.Struct({
  query: Schema.String,
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String),
});

const ListPlatformSkillsArgsSchema = Schema.Struct({
  query: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String),
});

const SearchAutomationsArgsSchema = Schema.Struct({
  query: Schema.String,
  limit: Schema.optional(Schema.Number),
  cursor: Schema.optional(Schema.String),
});

const GetAutomationArgsSchema = Schema.Struct({
  domain: Schema.String,
  command: Schema.optional(Schema.String),
});

const RunAutomationArgsSchema = Schema.Struct({
  domain: Schema.String,
  command: Schema.String,
  args: Schema.optional(Schema.Array(Schema.String)),
  dryRun: Schema.optional(Schema.Boolean),
  yes: Schema.optional(Schema.Boolean),
  cdp: Schema.optional(Schema.String),
  profile: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number),
});

const tools = [
  {
    name: 'search_skills',
    description:
      'Fuzzy-search buyer goals/skills (goal-index SSOT). Returns a page envelope. Prefer this before opening skill files.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Goal phrase or skill id (empty string lists all)',
        },
        template: {
          type: 'string',
          enum: ['web', 'mobile', 'extension', 'backend', 'spa'],
          description: 'Template surface (default web)',
        },
        limit: { type: 'number', description: 'Page size (default 20, max 50)' },
        cursor: { type: 'string', description: 'Opaque nextCursor from previous page' },
      },
      required: ['query'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'get_skill',
    description:
      'Load one buyer skill by goal id or skill file stem. Returns goal line + short excerpt (not the full file by default).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Goal id (e.g. setup-payments) or skill file stem' },
        template: {
          type: 'string',
          enum: ['web', 'mobile', 'extension', 'backend', 'spa'],
        },
        excerptLines: {
          type: 'number',
          description: 'Max body lines to include (default 40)',
        },
      },
      required: ['id'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'list_platform_skills',
    description: 'List/search platform skill wrappers under .vybekiit/platform-skills (paginated).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional fuzzy filter' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'search_commands',
    description:
      'Fuzzy-search vybekiit CLI verbs. Returns usage strings — run them via shell, not MCP.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Command name or purpose (empty = list all)' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'get_command',
    description: 'Get one CLI command by exact name from the catalog.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact command name, e.g. doctor or doc-fallback' },
      },
      required: ['name'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'search_doctor_tools',
    description:
      'List doctor toolchain entries agents can ensure via `vybekiit doctor --ensure <name>`. Does not run doctor.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Tool name or purpose (empty = list all)' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'search_tech_ids',
    description: 'Fuzzy-search known tech ids before calling doc_fallback.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Provider/tech name (empty = list all)' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'doc_fallback',
    description:
      'Official docs + env keys when MCP or the first debug attempt fails once. Same as `vybekiit doc-fallback <tech-id>`. Never name MCP to the builder — use builderMessage.',
    inputSchema: {
      type: 'object',
      properties: {
        techId: {
          type: 'string',
          description: 'Tech id from search_tech_ids, e.g. stripe, twilio',
        },
      },
      required: ['techId'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'search_automations',
    description:
      'Fuzzy-search vybekiit-automate browser-automation verbs (Lemon Squeezy, CWS, registrars, dbs, infra, …). Paginated. Prefer this before run_automation.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Domain/verb/purpose (empty = list all). e.g. "lemon squeezy", "standby"',
        },
        limit: { type: 'number', description: 'Page size (default 20, max 50)' },
        cursor: { type: 'string', description: 'Opaque nextCursor from previous page' },
      },
      required: ['query'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'get_automation',
    description:
      'Get one automation by domain (+ command) or id (`ls:setup`). Returns usage string for shell or run_automation.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Domain/alias (`ls`, `extension`) or full id (`ls:setup`)',
        },
        command: {
          type: 'string',
          description: 'Verb name when domain is not a full id (e.g. setup, standby)',
        },
      },
      required: ['domain'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
  {
    name: 'run_automation',
    description:
      'Run a vybekiit-automate verb from ANY project root (resolves bin via VYBEKIIT_AUTOMATE_BIN → package dist → monorepo → PATH). Always --json. Prefer dryRun=true first. For Google Error 400 redirect_uri_mismatch / Auth.js localhost: domain=google command=oauth with --project --app-name --support-email --app-url and repeated --redirect=… (include http://localhost:3000/api/auth/callback/google). Do not hand-drive Google Console with chrome-devtools — this verb patches existing Web clients idempotently. Opens a real browser when not dryRun.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Domain or alias, e.g. google, ls, nc, extension, cf',
        },
        command: {
          type: 'string',
          description: 'Verb, e.g. oauth, setup, standby',
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Extra CLI args, e.g. ["--project=my-app","--app-name=MyApp","--support-email=you@gmail.com","--app-url=https://example.com","--redirect=http://localhost:3000/api/auth/callback/google"]',
        },
        dryRun: {
          type: 'boolean',
          description: 'If true, only return planned bin+argv (no browser). Default false.',
        },
        yes: {
          type: 'boolean',
          description: 'Pass --yes for non-interactive mode (default true)',
        },
        cdp: { type: 'string', description: 'Optional --cdp= URL for existing Chrome' },
        profile: {
          type: 'string',
          description: 'Optional --profile= path or "last"',
        },
        timeoutMs: {
          type: 'number',
          description: 'Kill after this many ms (default 600000 = 10 min)',
        },
      },
      required: ['domain', 'command'],
      additionalProperties: false,
    } satisfies ToolInputSchema,
  },
] satisfies readonly Tool[];

/**
 * Resolve the project root for skill file reads.
 *
 * @returns Env override or process.cwd().
 * @example
 * resolveProjectRoot();
 */
const resolveProjectRoot = (): string => process.env.VYBEKIIT_PROJECT_ROOT ?? process.cwd();

/**
 * Encode an MCP tool response as formatted JSON text.
 *
 * @param value - Tool response payload.
 * @returns A text MCP tool result.
 * @example
 * jsonText({ ok: true });
 */
const jsonText = (value: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

/**
 * Encode an MCP tool error as plain text.
 *
 * @param message - Error message.
 * @returns Error tool result.
 * @example
 * errorText('Not found');
 */
const errorText = (message: string): CallToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
});

/**
 * Decode MCP tool arguments with Effect Schema.
 *
 * @param schema - Schema for the tool arguments.
 * @param toolName - Tool name for errors.
 * @param args - Unknown MCP arguments.
 * @returns Decoded arguments.
 * @throws McpError when invalid.
 * @example
 * decodeToolArgs(GetCommandArgsSchema, 'get_command', args);
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
 * Dispatch one agent MCP tool call.
 *
 * @param toolName - MCP tool name.
 * @param args - Unknown arguments payload.
 * @returns Tool result.
 * @example
 * await callTool('search_commands', { query: 'doctor' });
 */
const callTool = async (toolName: string, args: unknown): Promise<CallToolResult> => {
  switch (toolName) {
    case 'search_skills': {
      const params = decodeToolArgs(SearchSkillsArgsSchema, toolName, args);
      return jsonText(
        searchSkills(params.query, {
          ...(params.template === undefined ? {} : { template: params.template }),
          ...(params.limit === undefined ? {} : { limit: params.limit }),
          ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
        }),
      );
    }
    case 'get_skill': {
      const params = decodeToolArgs(GetSkillArgsSchema, toolName, args);
      const detail = await getSkill(resolveProjectRoot(), params.id, {
        ...(params.template === undefined ? {} : { template: params.template }),
        ...(params.excerptLines === undefined ? {} : { excerptLines: params.excerptLines }),
      });
      if (!detail.exists && detail.phrases.length === 0) {
        return errorText(`Unknown skill: ${params.id}`);
      }
      return jsonText(detail);
    }
    case 'list_platform_skills': {
      const params = decodeToolArgs(ListPlatformSkillsArgsSchema, toolName, args);
      return jsonText(
        await listPlatformSkills(resolveProjectRoot(), {
          ...(params.query === undefined ? {} : { query: params.query }),
          ...(params.limit === undefined ? {} : { limit: params.limit }),
          ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
        }),
      );
    }
    case 'search_commands': {
      const params = decodeToolArgs(SearchCommandsArgsSchema, toolName, args);
      return jsonText(
        searchCommands(params.query, {
          ...(params.limit === undefined ? {} : { limit: params.limit }),
          ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
        }),
      );
    }
    case 'get_command': {
      const params = decodeToolArgs(GetCommandArgsSchema, toolName, args);
      const command = getCommand(params.name);
      if (command === undefined) {
        return errorText(`Unknown command: ${params.name}`);
      }
      return jsonText(command);
    }
    case 'search_doctor_tools': {
      const params = decodeToolArgs(SearchDoctorToolsArgsSchema, toolName, args);
      return jsonText(
        searchDoctorTools(params.query, {
          ...(params.limit === undefined ? {} : { limit: params.limit }),
          ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
        }),
      );
    }
    case 'search_tech_ids': {
      const params = decodeToolArgs(SearchTechIdsArgsSchema, toolName, args);
      return jsonText(
        searchTechIds(params.query, {
          ...(params.limit === undefined ? {} : { limit: params.limit }),
          ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
        }),
      );
    }
    case 'doc_fallback': {
      const params = decodeToolArgs(DocFallbackArgsSchema, toolName, args);
      return jsonText(runDocFallback(params.techId));
    }
    case 'search_automations': {
      const params = decodeToolArgs(SearchAutomationsArgsSchema, toolName, args);
      return jsonText(
        searchAutomations(params.query, {
          ...(params.limit === undefined ? {} : { limit: params.limit }),
          ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
        }),
      );
    }
    case 'get_automation': {
      const params = decodeToolArgs(GetAutomationArgsSchema, toolName, args);
      const entry =
        params.command === undefined
          ? lookupAutomation(params.domain)
          : lookupAutomation(params.domain, params.command);
      if (entry === undefined) {
        return errorText(
          `Unknown automation: ${params.domain}${params.command === undefined ? '' : ` ${params.command}`}`,
        );
      }
      return jsonText(entry);
    }
    case 'run_automation': {
      const params = decodeToolArgs(RunAutomationArgsSchema, toolName, args);
      const result = await runAutomation(params.domain, params.command, {
        ...(params.args === undefined ? {} : { args: params.args }),
        ...(params.dryRun === undefined ? {} : { dryRun: params.dryRun }),
        ...(params.yes === undefined ? {} : { yes: params.yes }),
        ...(params.cdp === undefined ? {} : { cdp: params.cdp }),
        ...(params.profile === undefined ? {} : { profile: params.profile }),
        ...(params.timeoutMs === undefined ? {} : { timeoutMs: params.timeoutMs }),
        cwd: resolveProjectRoot(),
      });
      return jsonText(result);
    }
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
  }
};

/**
 * Start the VybeKiit agent MCP server over stdio.
 *
 * @returns A promise that resolves when the server is connected.
 * @example
 * await main();
 */
const main = async (): Promise<void> => {
  const server = new Server(
    {
      name: 'vybekiit',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    callTool(request.params.name, request.params.arguments),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

/**
 * Convert an unknown fatal error into stderr output and exit.
 *
 * @param error - Unknown error from main.
 * @returns Never.
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
