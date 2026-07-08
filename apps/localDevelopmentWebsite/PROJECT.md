# PROJECT.md — VybeKiit Local Dev Console

Purpose and direction. Read this to understand *why* the app exists and where it's
going; read `CONTEXT.md` for how it's shaped, `LANGUAGE.md` for the words.

## What it is

A browser-based local development console that gives a vibe coder a visual, professional
chat interface to their AI coding agents. It replaces the terminal as the primary interaction
point for someone who does not want to type CLI commands. The user describes what they want,
picks which agent to talk to, attaches files or images, and watches the agent work through
MCP-rendered workflow steps in real time.

## Who it's for

The **non-terminal vibe coder**: typically 40-60, has a paid AI subscription (Claude, Codex,
Cursor), can clearly describe what they want, but does not want to read or write terminal
output. They open a browser tab and talk to their agent the way they would talk to ChatGPT,
but the agent actually builds their project.

## Why it exists

Terminals are powerful but alienating for this audience. Every existing agent interface (Claude
Code, Kiro, Cursor) assumes the user is comfortable in a code editor or terminal. This app
provides a clean, minimal, professional GUI that:

- Lets the user pick an agent and talk to it naturally
- Shows workflow progress visually (not as log lines)
- Supports rich input (files, images, URLs) without drag-and-drop into a terminal
- Renders MCP tool calls as visible UI cards, not hidden stdio

## Direction

- **v0.1 (current):** Hardcoded demo workflows, mock agent replies, basic chat UI. Proof of
  concept only.
- **v0.2:** Real agent sessions. A local WebSocket daemon (`ws://localhost:3006`) spawns and
  manages agent CLI processes (Claude Code, Gemini CLI, Cursor). The UI streams real output,
  renders workflow steps from MCP tool calls, and supports rich input (files, images, URLs).
  Sidebar collapsed by default. Agent picker in the input bar. Voice activation button.
- **v0.3:** MCP-UI rendering: tool calls from the agent appear as live, animated workflow cards.
  Preset workflows (auth, payments, deploy) are triggered by the agent, not a button.
- **v1.0:** Production-ready local console: multi-conversation, full attachment support, agent
  switching, workflow history, session export.

## Non-goals

- Not deployed publicly. Runs on `localhost:3005` only.
- Not a general-purpose chat app. Purpose-built for the vybekiit agent workflow.
- Not a code editor. The agent edits code; the user watches and describes.
- Not mobile-first. Desktop browser (the user is at their dev machine).

## What success looks like

A vibe coder opens `localhost:3005`, picks Claude Code, types "ship my SaaS with auth and
payments", and watches the agent scaffold, wire, and deploy the project step by step. Each
MCP tool call renders as a visible card. The user never opens a terminal.

## Constraints

- Next.js 15 (App Router), React 19, Tailwind v3, shadcn/ui from `@vybekiit/ui`.
- Dark-mode only (zinc-950 base, vybe purple accent).
- Must work with any MCP-capable agent (Claude Code, Cursor, Kiro, Codex).
- UI primitives come from `packages/ui/` (`@vybekiit/ui` workspace dep).
- No backend persistence yet (localStorage). SQLite reserved for later.
