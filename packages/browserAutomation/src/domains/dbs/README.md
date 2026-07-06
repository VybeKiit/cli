# Database providers

Credential onboarding here is **CLI-first, browser-fallback** (see [ADR-0032](../../../../../docs/adr/0032-cli-first-provider-token-automation.md), which amends the earlier "MCP-first, no DOM automation" scope). MCP + platform skills remain the path for schema/runtime work.

| Provider | CLI | `setup` path |
|----------|-----|--------------|
| Supabase (`db`) | `supabase` | CLI reads project URL + `anon`/`service_role` keys (`supabase projects api-keys`). Browser fallback only when the CLI can't resolve the project. Writes `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`. |
| Neon (`neon`) | `neonctl` | CLI-only: `neonctl connection-string --pooled`. Writes `DATABASE_URL`. No browser path. |
| Upstash (`upstash`) | — | No first-party CLI to mint a token; REST-first. Builder pastes `--rest-url` + `--rest-token` (the browser-fallback inputs), verified with a live REST ping. Writes `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. |

Each `setup` ensures its CLI via `vybekiit doctor --ensure <tool>` first (`core/ensureCli.ts`), verifies the credential live, and writes it via `core/writeEnvBlock.ts` — the agent only ever sees `keysWritten`, never the value.

Firebase and other schema/runtime concerns still use the Supabase/Neon/Firebase MCP servers + `save-data` platform skills.
