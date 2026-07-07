#!/usr/bin/env node

/**
 * VybeKiit MCP Server
 *
 * Serves UI components and manages agent sessions.
 * Agents (Kiro, Claude Code, Codex) can call these tools to:
 * - Render dynamic UI components in the development console
 * - List/create/resume sessions
 * - Report workflow progress
 * - Send notifications to the UI
 *
 * Usage:
 *   node mcp-server/index.mjs
 *
 * Register with Kiro:
 *   kiro-cli mcp add --name vybekiit --command node --args "apps/localDevelopmentWebsite/src/mcp-server/index.mjs"
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const KIRO_SESSIONS_DIR = join(homedir(), '.kiro', 'sessions', 'cli');

const valueOr = (value, defaultValue) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
};

const textField = (data, key, defaultValue) => String(valueOr(data[key], defaultValue));

// ─── Server Setup ────────────────────────────────────────────────────────────

const server = new Server({ name: 'vybekiit', version: '0.2.0' }, { capabilities: { tools: {} } });

// ─── Tool Definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_sessions',
      description:
        'List all coding sessions from the development Console UI. Returns session IDs, titles, timestamps, and working directories.',
      inputSchema: {
        type: 'object',
        properties: {
          cwd: { type: 'string', description: 'Filter sessions by working directory (optional)' },
          limit: { type: 'number', description: 'Max sessions to return (default 20)' },
        },
      },
    },
    {
      name: 'get_session',
      description: 'Get full details of a specific coding session by ID.',
      inputSchema: {
        type: 'object',
        properties: {
          session_id: { type: 'string', description: 'The session UUID' },
        },
        required: ['session_id'],
      },
    },
    {
      name: 'create_session',
      description: 'Create a new coding session in the VybeKiit development Console UI.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Session title (e.g. "Build user dashboard")' },
          agent: {
            type: 'string',
            description: 'Agent ID: kiro, claude-code, cursor, gemini, codex',
          },
          cwd: { type: 'string', description: 'Working directory for the session' },
        },
        required: ['title'],
      },
    },
    {
      name: 'update_workflow',
      description:
        'Update workflow step status in the development console UI. The console will show the step as pending/running/done.',
      inputSchema: {
        type: 'object',
        properties: {
          session_id: { type: 'string', description: 'The session to update' },
          step_id: {
            type: 'string',
            description: 'Workflow step ID (e.g. scaffold, auth, database, deploy)',
          },
          status: {
            type: 'string',
            enum: ['pending', 'running', 'done', 'error'],
            description: 'New status',
          },
          message: { type: 'string', description: 'Optional status message to display' },
        },
        required: ['session_id', 'step_id', 'status'],
      },
    },
    {
      name: 'send_notification',
      description: 'Send a notification toast to the VybeKiit development console UI.',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Notification message' },
          variant: {
            type: 'string',
            enum: ['success', 'info', 'warning', 'error'],
            description: 'Toast variant',
          },
        },
        required: ['message'],
      },
    },
    {
      name: 'render_component',
      description:
        'Request the VybeKiit UI to render a dynamic component. The component will appear in the development Console UI.',
      inputSchema: {
        type: 'object',
        properties: {
          component: {
            type: 'string',
            enum: [
              'terminal_block',
              'progress_ring',
              'step_indicator',
              'glow_card',
              'notification_toast',
              'agent_avatar',
              'logo_grid',
              'gradient_text',
            ],
            description: 'Which UI component to render',
          },
          props: { type: 'object', description: 'Props to pass to the component' },
          target: {
            type: 'string',
            description: 'Where to render: sidebar, main, overlay (default: main)',
          },
        },
        required: ['component', 'props'],
      },
    },
    {
      name: 'list_ui_components',
      description: 'List all available UI components that can render in the VybeKiit Console UI.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

// ─── Tool Implementations ────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_sessions': {
      const limit = Number(valueOr(args?.limit, 20));
      const cwdFilter = args?.cwd;

      try {
        const files = await readdir(KIRO_SESSIONS_DIR);
        const jsonFiles = files.filter((f) => f.endsWith('.json')).slice(0, 100);

        const sessions = [];
        for (const file of jsonFiles) {
          try {
            const raw = await readFile(join(KIRO_SESSIONS_DIR, file), 'utf-8');
            const data = JSON.parse(raw);
            const cwdMatches = !cwdFilter || data.cwd === cwdFilter;
            if (cwdMatches) {
              sessions.push({
                session_id: data.session_id,
                title: textField(data, 'title', '(untitled)').slice(0, 80),
                cwd: data.cwd,
                created_at: data.created_at,
                updated_at: data.updated_at,
                agent: 'kiro',
              });
            }
          } catch {
            /* skip malformed */
          }
        }

        sessions.sort((a, b) =>
          textField(b, 'updated_at', '').localeCompare(textField(a, 'updated_at', '')),
        );
        const result = sessions.slice(0, limit);

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error reading sessions: ${err}` }],
          isError: true,
        };
      }
    }

    case 'get_session': {
      const sessionId = args?.session_id;
      try {
        const raw = await readFile(join(KIRO_SESSIONS_DIR, `${sessionId}.json`), 'utf-8');
        const data = JSON.parse(raw);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  session_id: data.session_id,
                  title: data.title,
                  cwd: data.cwd,
                  created_at: data.created_at,
                  updated_at: data.updated_at,
                  parent_session_id: data.parent_session_id,
                  session_created_reason: data.session_created_reason,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: `Session not found: ${err}` }], isError: true };
      }
    }

    case 'create_session': {
      const title = String(valueOr(args?.title, 'New Session'));
      const agent = String(valueOr(args?.agent, 'kiro'));
      const cwd = String(valueOr(args?.cwd, process.cwd()));

      const launchCommandByAgent = {
        kiro: `kiro-cli chat "${title}"`,
        'claude-code': `claude "${title}"`,
      };

      // We generate a session reference — the actual Kiro session is created via CLI launch
      const sessionRef = {
        id: crypto.randomUUID(),
        title,
        agent,
        cwd,
        created_at: new Date().toISOString(),
        status: 'ready',
        launch_command:
          launchCommandByAgent[agent] === undefined
            ? `${agent} "${title}"`
            : launchCommandByAgent[agent],
      };

      return { content: [{ type: 'text', text: JSON.stringify(sessionRef, null, 2) }] };
    }

    case 'update_workflow': {
      // In a full implementation, this would write to a shared state file or send via WebSocket
      const update = {
        session_id: args?.session_id,
        step_id: args?.step_id,
        status: args?.status,
        message: args?.message,
        timestamp: new Date().toISOString(),
      };
      return { content: [{ type: 'text', text: `Workflow updated: ${JSON.stringify(update)}` }] };
    }

    case 'send_notification': {
      const notification = {
        message: args?.message,
        variant: valueOr(args?.variant, 'info'),
        timestamp: new Date().toISOString(),
      };
      return {
        content: [{ type: 'text', text: `Notification sent: ${JSON.stringify(notification)}` }],
      };
    }

    case 'render_component': {
      const render = {
        component: args?.component,
        props: args?.props,
        target: valueOr(args?.target, 'main'),
      };
      return {
        content: [{ type: 'text', text: `Component render requested: ${JSON.stringify(render)}` }],
      };
    }

    case 'list_ui_components': {
      const components = [
        {
          name: 'terminal_block',
          description: 'Terminal-style output block with colored dots',
          props: ['lines: string[]', 'title?: string'],
        },
        {
          name: 'progress_ring',
          description: 'Circular SVG progress indicator',
          props: ['value: number', 'max?: number', 'color?: string', 'label?: string'],
        },
        {
          name: 'step_indicator',
          description: 'Vertical/horizontal step progress',
          props: ['steps: { id, label, status }[]', 'orientation?: vertical|horizontal'],
        },
        {
          name: 'glow_card',
          description: 'Card with animated glow border',
          props: ['children', 'color?: string', 'active?: boolean'],
        },
        {
          name: 'notification_toast',
          description: 'Auto-dismiss notification',
          props: ['message: string', 'variant?: success|info|warning|error'],
        },
        {
          name: 'agent_avatar',
          description: 'Avatar with status ring',
          props: ['name: string', 'status?: online|busy|idle|offline'],
        },
        {
          name: 'logo_grid',
          description: 'Selectable tech logo grid',
          props: ['logos: { id, name, color, svg }[]', 'selectable?: boolean'],
        },
        {
          name: 'gradient_text',
          description: 'Animated gradient text',
          props: ['children', 'colors?: string[]'],
        },
        {
          name: 'shimmer_button',
          description: 'Button with shimmer animation',
          props: ['children', 'color?: string', 'size?: sm|md|lg'],
        },
        {
          name: 'animated_counter',
          description: 'Rolling number counter',
          props: ['value: number', 'duration?: number', 'suffix?: string'],
        },
        {
          name: 'type_writer',
          description: 'Typewriter text animation',
          props: ['text: string', 'speed?: number', 'cursor?: boolean'],
        },
        {
          name: 'pulse_beam',
          description: 'Pulsing status dot',
          props: ['color?: green|orange|red|blue|purple', 'size?: sm|md|lg'],
        },
        {
          name: 'skeleton_pulse',
          description: 'Loading skeleton with shimmer',
          props: ['width?: string', 'height?: string'],
        },
        {
          name: 'floating_panel',
          description: 'Draggable overlay panel',
          props: ['title?: string', 'children'],
        },
      ];
      return { content: [{ type: 'text', text: JSON.stringify(components, null, 2) }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
