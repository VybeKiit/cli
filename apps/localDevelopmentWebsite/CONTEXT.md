# CONTEXT.md — VybeKiit Local Dev Console

Orientation: what this app is, its moving parts, and how they fit. For purpose
and direction see `PROJECT.md`; for the words see `LANGUAGE.md`.

## What it is

A Next.js 15 local-only web app that gives a vibe coder a professional chat UI to
their AI agent. Opened via `vybekiit local-dev`, it runs on `localhost:3005` and
connects to agents over MCP (stdio or bridge).

## The three layers

```text
  ┌──────────────────────────────────────────────────────────┐
  │  Browser tab (localhost:3005)                             │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  Chat UI                                           │  │
  │  │  - Sidebar (collapsed by default)                  │  │
  │  │  - Message thread                                  │  │
  │  │  - Input bar (text, files, images, URLs, voice)    │  │
  │  │  - Agent picker (in input bar)                     │  │
  │  └────────────────────────────────────────────────────┘  │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  Workflow panel (right rail / inline)               │  │
  │  │  - MCP-UI rendered tool call cards                 │  │
  │  │  - Step progress (pending → running → done)        │  │
  │  └────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
  ┌──────────────┐           ┌──────────────────────┐
  │  State layer │           │  Daemon (ws://:3006) │
  │  Zustand     │           │  Agent process mgmt  │
  │  + persist   │           │  Claude/Gemini/Cursor│
  └──────────────┘           └──────────────────────┘
```

| Layer | Tech | Job |
|-------|------|-----|
| **Chat UI** | React 19 + Tailwind + @vybekiit/ui primitives | Visual conversation interface. Rich input. Agent badges. |
| **Workflow panel** | Framer Motion + workflow state machine | Renders MCP tool calls as animated step cards. |
| **State** | Zustand + persist middleware | Conversations, messages, session log, workflow progress. |
| **Daemon** | Node.js + ws (WebSocket server on :3006) | Spawns agent CLIs, streams output, manages sessions. |

## Daemon protocol

```typescript
// Client → Daemon
| { type: 'agent.spawn'; agent: AgentId }
| { type: 'agent.stop'; sessionId: string }
| { type: 'agent.send'; sessionId: string; content: string }
| { type: 'agent.list' }
| { type: 'session.history'; agent: AgentId }

// Daemon → Client
| { type: 'agent.output'; sessionId: string; chunk: string }
| { type: 'agent.step'; sessionId: string; step: WorkflowStep }
| { type: 'agent.status'; sessionId: string; status: 'running' | 'idle' | 'error' }
| { type: 'agent.list'; agents: AgentStatus[] }
| { type: 'session.history'; sessions: Session[] }
| { type: 'error'; message: string }
```

## Component map

| Component | File | Job |
|-----------|------|-----|
| `ChatInterface` | `chatInterface.tsx` | Root layout: sidebar + messages + input + workflow rail |
| `ChatInput` | `chatInput.tsx` | Text input + send button (v0.2: attachments) |
| `ChatMessage` | `chatMessage.tsx` | Single message bubble (user or agent) |
| `ChatSidebar` | `chatSidebar.tsx` | Conversation list + new/delete + mobile sheet |
| `AgentCarousel` | `agentCarousel.tsx` | Decorative scrolling agent logos |
| `AgentBadge` | `agentBadge.tsx` | Active agent indicator with MCP badge |
| `WorkflowRunner` | `workflowRunner.tsx` | Orchestrates workflow step progression |
| `WorkflowStepItem` | `workflowStep.tsx` | Single step card with status icon + animation |
| `PromptComposer` | `promptComposer.tsx` | Suggestion chips + textarea + copy/send (legacy) |
| `McpPanel` | `mcpPanel.tsx` | Displays available MCP tools |
| `SessionLog` | `sessionLog.tsx` | Scrollable activity log |

## State architecture

Zustand stores with persist middleware:
- **chatStore** — conversations and messages, persisted to localStorage.
- **agentStore** — active agent, connection status, available agents.
- **workflowStore** — workflow step progression per conversation.

Hooks are thin Zustand selectors (`useChatStore((s) => s.conversations)`).
Non-store hooks (DOM, lifecycle) use traditional useState/useEffect.

Workflow state is per-conversation, persisted via Zustand persist.

## Where UI primitives come from

`@vybekiit/ui` — a shared internal package at `packages/ui/` containing 46 shadcn/ui
components (Button, Input, Avatar, Sheet, Dialog, Tabs, etc.) plus the `cn()` utility.
All apps in the monorepo import directly:

```typescript
import { Button, Input, Sheet } from '@vybekiit/ui';
```

Custom app-specific components live in `src/components/` and compose UI primitives
from the package. To add a new shared component, add it to `packages/ui/src/` and
re-export from `packages/ui/src/index.ts`.

## Design system

- **Background:** zinc-950 (near-black)
- **Accent:** vybe purple (500: #8b5cf6, 600: #7c3aed)
- **Text:** zinc-100/200/300/400 hierarchy
- **Borders:** zinc-800
- **Radius:** rounded-2xl (cards), rounded-xl (inputs), rounded-full (badges)
- **Font:** Geist Sans (body), Geist Mono (code)
- **Motion:** Framer Motion for step entries, CSS for carousel

## How to run

```bash
vybekiit local-dev
# or directly:
cd apps/localDevelopmentWebsite && pnpm dev
```

Opens `http://localhost:3005`. Detects the running agent from env vars.
