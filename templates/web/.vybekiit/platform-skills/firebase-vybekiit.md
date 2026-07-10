# Platform wrapper: Firebase (Firestore)

**Agent-only.** Invoked by buyer skills `save-data` and `doctor`.

## Official upstream

- Agent skills: https://firebase.google.com/docs/ai-assistance/agent-skills
- MCP server: `npx -y firebase-tools@latest mcp`
- Install skills: `npx skills add firebase/agent-skills --agent=cursor`

## Kit wiring

1. Set `DATA_PROVIDER=firebase`, `FIREBASE_PROJECT_ID`, and credentials (`FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`)
2. Data via `@vybekiit/db` → `resolveDataProvider()` — never raw Firestore in UI
3. Firebase Auth is a follow-up skill; default auth remains `better-auth` unless agent wires Firebase Auth
4. Storage stays on `STORAGE_PROVIDER=supabase|r2|s3` (Firebase Storage not in v1)

## MCP

Merge `.vybekiit/agent/mcp-firebase.json` alongside `mcp-ui-catalog.json` in `.cursor/mcp.json`.

Skills + MCP are complementary: skills teach how; MCP executes.

## Verify-before-advance

- `pingFirebaseDatabase()` green via doctor
- Firebase CLI authenticated locally for MCP (`firebase login`)
