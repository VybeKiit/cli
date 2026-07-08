# LANGUAGE.md — VybeKiit Local Dev Console

The glossary. Every term that appears in code, UI copy, or agent communication.
When in doubt, use the **term** column. Avoid the aliases.

| Term | Definition | Avoid calling it |
|------|-----------|-----------------|
| **Console** | This app (`localDevelopmentWebsite`). The browser-based dev interface. | dashboard, portal, IDE, admin |
| **Vibe coder** | The target user. Describes what they want; does not write code. | developer, user, customer |
| **Agent** | An AI coding tool the vibe coder talks to (Claude Code, Cursor, Kiro, Codex). | AI, model, LLM, bot |
| **Conversation** | A chat thread between the vibe coder and one agent. Has messages. | chat, session, thread |
| **Message** | A single turn in a conversation. Either `user` or `agent` role. | prompt, response, turn |
| **Workflow** | A multi-step process the agent executes (e.g. "Ship SaaS"). Rendered visually. | pipeline, task list, checklist |
| **Step** | One unit of work inside a workflow. Has a status (pending/running/done/error). | task, action, job |
| **MCP** | Model Context Protocol. The wire protocol agents use to call tools. | API, RPC, bridge |
| **Tool call** | A single MCP tool invocation the agent makes. Rendered as a step card. | function call, command, action |
| **Bridge** | `ai-browser-bridge`. Drives browser AI conversations from terminal/MCP. | browser automation, scraper |
| **Daemon** | The local WebSocket process (`ws://localhost:3006`) that spawns and manages agent CLIs. | server, backend, sidecar |
| **Agent picker** | The UI element where the vibe coder selects which agent to talk to. | model selector, dropdown |
| **Workflow panel** | The right-rail UI showing live workflow progress. | sidebar, activity panel |
| **Session log** | Timestamped activity entries (info/success/warning/error). Debug-level. | console, logs, terminal |
| **Preset** | A pre-built workflow definition (auth, payments, deploy). | template, recipe, blueprint |
| **Rich input** | Chat input that accepts files, images, URLs beyond plain text. | attachments, uploads, media |
