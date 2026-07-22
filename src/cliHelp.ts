import { CREATE_SURFACE_PIPE_FLAGS, CREATE_SURFACES } from './commands/createSurfaceRegistry';

const createSurfaceUsage = CREATE_SURFACES.map(
  (surface) => `  vybekiit create app --${surface.id} [directory]`,
).join('\n');

const createSurfaceHelp = CREATE_SURFACES.map((surface) => {
  const surfaceFlag = `--${surface.id}`.padEnd(14);
  return `  ${surfaceFlag}${surface.help}`;
}).join('\n');

/** Buyer-tier help printed by `vybekiit --help` and bare non-TTY (ADR-0038). */
export const CLI_HELP = `vybekiit — set up tools and create your app

Getting started:
  vybekiit                 Interactive menu (terminal only)
  vybekiit setup           Welcome + set up Claude Code globally (skills, MCP, tools)
  vybekiit doctor          Full toolchain pass (agents, gh, cloud CLIs, skills, …)
${createSurfaceUsage}

After your app exists (your AI coding tool drives these):
  vybekiit list-pieces · list-page-recipes · list-presets
  vybekiit add page-recipe <id> [--to=dir] [--dry-run] [--force]
  vybekiit add report-mode [--to=dir] [--dry-run] [--force]
  vybekiit apply-preset <id> [--cwd=dir] · verify-presets
  vybekiit scaffold backend · backend add-route|add-crud|add-upload|gen-contract
  vybekiit env wizard · sync-agent-layer · update path via your agent

Surfaces:
${createSurfaceHelp}

Examples:
  vybekiit setup
  vybekiit create app --web
  vybekiit create app --mobile ./my-app
  vybekiit doctor

Options:
  -h, --help       Buyer help (this text)
  --help --all     Full command list (agents / power users)
  -v, --version    Show the CLI version

Tip: open your app folder and say "Set up my app." to your coding tool.
`;

/** Full verb list for agents and power users (`vybekiit help --all`). */
export const CLI_HELP_ALL = `vybekiit — full command list

Buyer journey:
  vybekiit setup
  vybekiit global-install [--yes]         (skills + MCP + awareness into ~/.claude)
  vybekiit update                         (re-run auto-updater: latest skills + MCP)
  vybekiit doctor
  vybekiit doctor --ensure <tool> [--json]
  vybekiit create app ${CREATE_SURFACE_PIPE_FLAGS} [directory]

Create / project:
  vybekiit new [template] [directory]     (deprecated → create app)
  vybekiit drop <template> [path] [--force|--merge|--dry-run|--json]
  vybekiit init [directory]
  vybekiit local-dev
  vybekiit scaffold backend [directory]

Agent / kit:
  vybekiit sync-agent-layer [template]
  vybekiit render-agent-layer
  vybekiit check-goals [template]
  vybekiit check-agent-layer [template]
  vybekiit plan-readiness <feature> [template]
  vybekiit plan-setup <domain>
  vybekiit plan-data-model <entities.json> [provider]
  vybekiit list-pieces [--kind=db|page-recipe|backend]
  vybekiit list-page-recipes
  vybekiit list-presets
  vybekiit add page-recipe <id> [--to=dir] [--dry-run] [--force]
  vybekiit add report-mode [--to=dir] [--dry-run] [--force]   (point & fix overlay into an existing app)
  vybekiit add                              (interactive: pick a ready piece)
  vybekiit apply-preset <feature> [--provider=supabase|neon|railway|mongodb|firebase|aws] [--cwd=dir] [--dry-run]
  vybekiit verify-presets [--fix] [--cwd=dir] [preset...]
  vybekiit live-work data [--mode=demo|dogfood|buyer] [--vendor=supabase|neon|railway] [--cwd=dir] [--no-pin] [--fresh]
  vybekiit live-work host [--mode=demo|dogfood|buyer] [--vendor=cloudflare|render|railway|vercel|netlify|github-pages] [--cwd=dir] [--no-pin] [--fresh]
  vybekiit live-work payments [--mode=demo|dogfood|buyer] [--vendor=lemon-squeezy|stripe|paypal] [--cwd=dir] [--no-pin] [--fresh]
  vybekiit lint-extension-skill <path> [--kind=buyer-goal|platform-wrapper|agent-skills-global]
  vybekiit doc-fallback <tech-id>
  vybekiit feedback status | feedback submit <draft> [--confirm]
  vybekiit dedup [--intent <desc>] [--target <file>] [--scope <dir>] [--index] [--json]
  vybekiit add bridge
  vybekiit env wizard
  vybekiit backend add-route <name>
  vybekiit backend add-crud <resource>
  vybekiit backend add-upload
  vybekiit backend gen-contract           (emit backend/openapi.json from the route registry)

Options:
  -h, --help       Buyer help
  --help --all     This full list
  -v, --version    Show the CLI version
`;
