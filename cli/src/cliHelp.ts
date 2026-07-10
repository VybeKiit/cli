/** Help text printed by `vybekiit --help`. */
export const CLI_HELP = `vybekiit - scaffold a VybeKiit template into your own repo

Usage:
  vybekiit setup
  vybekiit new [template] [directory]
  vybekiit drop <template> [path] [--force|--merge|--dry-run|--json]
  vybekiit init [directory]
  vybekiit local-dev
  vybekiit scaffold backend [directory]
  vybekiit doctor
  vybekiit doctor --ensure <tool> [--json]
  vybekiit sync-agent-layer [template]
  vybekiit render-agent-layer
  vybekiit check-goals [template]
  vybekiit plan-readiness <feature> [template]
  vybekiit plan-setup <domain>
  vybekiit plan-data-model <entities.json> [provider]
  vybekiit apply-preset <feature> [--provider=supabase|neon|railway|mongodb|firebase|aws] [--dry-run]
  vybekiit list-presets
  vybekiit verify-presets [--fix] [preset...]
  vybekiit check-agent-layer [template]
  vybekiit lint-extension-skill <path> [--kind=buyer-goal|platform-wrapper|agent-skills-global]
  vybekiit doc-fallback <tech-id>
  vybekiit dedup [--intent <desc>] [--target <file>] [--scope <dir>] [--index] [--json]
  vybekiit add bridge
  vybekiit env wizard
  vybekiit backend add-route <name>
  vybekiit backend add-crud <resource>
  vybekiit backend add-upload

Templates:
  web         Next.js + shadcn (RTL-ready) + the agent layer   [available]
  spa         Vite admin SPA + Express backend stack           [available]
  mobile      Expo                                             [available]
  extension   WXT                                              [available]
  backend     Express MVC API (pairs with spa)                 [available]

Commands:
  setup               Welcome banner + set up the tools your app needs
  new                 Scaffold a template into a NEW empty directory (interactive)
  drop                Copy/paste/drop a template to ANY path (agent-friendly)
  init                Bootstrap VybeKiit guardrails on an EXISTING project
  local-dev           Open the visual local dev console in your browser
  scaffold backend    Add Express API server to an existing project
  doctor              Set up + check the tools your app needs
  doctor --ensure     Install/verify a single named CLI on demand (e.g. wrangler, supabase)
  sync-agent-layer    Refresh agent instructions from the latest template mirror
  render-agent-layer  Regenerate marked sections from agent-kit
  check-goals         Validate goal-index -> skills (JSON, exit 1 on drift)
  check-agent-layer   Validate agent-layer structure and compliance (JSON)
  plan-readiness      Feature readiness + orchestration steps (JSON)
  plan-setup          Plain-language setup checklist for a domain
  plan-data-model     Data model plan from entities JSON file
  apply-preset        Apply a DB feature preset migration
  list-presets        List available DB feature presets (JSON)
  verify-presets      Verify preset tables exist; --fix applies missing
  lint-extension-skill Lint an extension skill draft before saving (JSON)
  doc-fallback        Official docs URLs when MCP or debug fails once (JSON)
  dedup               Deduplication gate: check for duplicates before creating (JSON)
  env wizard          Interactive .env setup (TTY only)
  add bridge          Install ai-browser-bridge globally + wire agent skills
  backend add-route   Append a route + controller to backend/
  backend add-crud    Scaffold CRUD routes for a resource
  backend add-upload  Add multer upload route

Examples:
  vybekiit setup
  vybekiit new
  vybekiit new web my-app
  vybekiit drop mobile ~/Projects/my-app
  vybekiit drop web . --force
  vybekiit drop backend ./api --json
  vybekiit doc-fallback twilio
  vybekiit check-goals mobile

Options:
  -h, --help       Show this help
  -v, --version    Show the CLI version
`;
