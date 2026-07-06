import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runAddBridge } from './commands/addBridge';
import {
  runBackendAddCrud,
  runBackendAddRoute,
  runBackendAddUpload,
  runScaffoldBackend,
} from './commands/backendCli';
import { runCheckAgentLayer } from './commands/checkAgentLayer';
import { runCheckGoals } from './commands/checkGoals';
import { runDedup } from './commands/dedup';
import { runDocFallback } from './commands/docFallback';
import { runDrop } from './commands/drop';
import { runInit } from './commands/init';
import { runLintExtensionSkill } from './commands/lintExtensionSkill';
import { runLocalDev } from './commands/localDev';
import { runNew } from './commands/new';
import { runPlanDataModel } from './commands/planDataModelCmd';
import { runPlanReadiness } from './commands/planReadiness';
import { runPlanSetup } from './commands/planSetupCmd';
import { runApplyPreset, runListPresets, runVerifyPresets } from './commands/presetsCmd';
import { runRenderAgentLayer } from './commands/renderAgentLayer';
import { runSetup } from './commands/setup';
import { runSyncAgentLayer } from './commands/syncAgentLayer';
import { ensureTool, formatEnsureResult } from './doctor/ensureTool';
import { ensureAccessOrExit } from './doctor/gate';
import { runDoctor } from './doctor/run';
import { runEnvWizard } from './prompts/envWizard';
import { isInteractive } from './prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));

const _HELP = `vybekiit — scaffold a VybeKiit template into your own repo

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
  vybekiit apply-preset <feature> [--provider=supabase|neon|railway] [--dry-run]
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
  backend     Express MVC API (pairs with spa)                   [available]

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
  check-goals         Validate goal-index ↔ skills (JSON, exit 1 on drift)
  check-agent-layer   Validate agent-layer structure and compliance (JSON)
  plan-readiness      Feature readiness + orchestration steps (JSON)
  plan-setup          Plain-language setup checklist for a domain
  plan-data-model     Data model plan from entities JSON file
  apply-preset        Apply a DB feature preset migration
  list-presets        List available DB feature presets (JSON)
  verify-presets      Verify preset tables exist; --fix applies missing
  lint-extension-skill Lint an extension skill draft before saving (JSON)
  doc-fallback        Official docs URLs when MCP or debug fails once (JSON)
  dedup               Deduplication gate — check for existing duplicates before creating (JSON)
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

/** Read the CLI's own version from its package.json. */
async function readVersion(): Promise<string> {
  try {
    const raw = await readFile(join(HERE, '..', 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export {
  cloneMirror,
  type ResolveDeps,
  type ResolvedSource,
  resolveTemplatesSource,
} from './lib/resolveTemplates';

/**
 * `vybekiit doctor --ensure <tool> [--json]` — on-demand single-tool preflight.
 *
 * Reuses the full doctor toolchain (install steps + auth probe) for just one CLI, so
 * provider automations can precheck/install the tool they need without a parallel layer.
 * Exit 0 when the tool ends up installed (auth may still be pending); 1 otherwise.
 */
function runDoctorEnsure(toolName: string | undefined, json: boolean): number {
  if (!toolName || toolName.startsWith('--')) {
    const message = 'Usage: vybekiit doctor --ensure <tool> [--json]';
    if (json) console.log(JSON.stringify({ ok: false, error: message }));
    else console.error(message);
    return 1;
  }
  const result = ensureTool(toolName);
  if (json) {
    console.log(JSON.stringify({ ok: result.installed, ...result }));
  } else {
    console.log(formatEnsureResult(result));
  }
  return result.installed ? 0 : 1;
}

async function main(argv: string[]): Promise<number> {
  const [command, subcommand, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(_HELP);
    return 0;
  }
  if (command === '--version' || command === '-v') {
    console.log(await readVersion());
    return 0;
  }
  // Access gate (ADR-0033): every command except help/version/doctor needs a VybeKiit
  // license. `doctor` is exempt so an ungated buyer can still install/sign in to gh.
  if (command !== 'doctor' && !ensureAccessOrExit()) {
    return 1;
  }
  if (command === 'setup') {
    return await runSetup();
  }
  if (command === 'new') {
    return runNew(rest);
  }
  if (command === 'drop') {
    return runDrop(subcommand ? [subcommand, ...rest] : rest);
  }
  if (command === 'doctor') {
    const doctorArgs = subcommand ? [subcommand, ...rest] : rest;
    const ensureArg = doctorArgs.find((a) => a === '--ensure' || a.startsWith('--ensure='));
    if (ensureArg) {
      const inline = ensureArg.includes('=') ? ensureArg.split('=')[1] : undefined;
      const toolName = inline ?? doctorArgs[doctorArgs.indexOf(ensureArg) + 1];
      const json = doctorArgs.includes('--json');
      return runDoctorEnsure(toolName, json);
    }
    return await runDoctor();
  }
  if (command === 'init') {
    return await runInit(rest);
  }
  if (command === 'local-dev') {
    return await runLocalDev();
  }
  if (command === 'sync-agent-layer') {
    const result = await runSyncAgentLayer(rest);
    for (const line of result.lines) {
      console.log(line);
    }
    return result.exitCode;
  }
  if (command === 'render-agent-layer') {
    const result = await runRenderAgentLayer();
    return result.exitCode;
  }
  if (command === 'check-goals') {
    const result = await runCheckGoals(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'check-agent-layer') {
    const result = await runCheckAgentLayer(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'plan-readiness') {
    const result = await runPlanReadiness(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'plan-setup') {
    const result = await runPlanSetup(rest);
    console.log(result.output);
    return result.exitCode;
  }
  if (command === 'plan-data-model') {
    const result = await runPlanDataModel(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'apply-preset') {
    const result = await runApplyPreset(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'list-presets') {
    const result = runListPresets();
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'verify-presets') {
    const result = await runVerifyPresets(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'lint-extension-skill') {
    const result = await runLintExtensionSkill(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'doc-fallback') {
    const result = runDocFallback(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'dedup') {
    const allArgs = subcommand ? [subcommand, ...rest] : rest;
    const result = await runDedup(allArgs);
    if (result.output) process.stdout.write(result.output);
    return result.exitCode;
  }
  if (command === 'add' && subcommand === 'bridge') {
    return await runAddBridge(rest);
  }
  if (command === 'env' && subcommand === 'wizard') {
    if (!isInteractive()) {
      console.error('env wizard requires an interactive terminal.');
      return 1;
    }
    return await runEnvWizard();
  }
  if (command === 'scaffold' && subcommand === 'backend') {
    const result = await runScaffoldBackend(rest, process.cwd());
    console.log(result.message);
    return result.exitCode;
  }
  if (command === 'backend') {
    if (subcommand === 'add-route') {
      const result = await runBackendAddRoute(rest);
      console.log(result.message);
      return result.exitCode;
    }
    if (subcommand === 'add-crud') {
      const result = await runBackendAddCrud(rest);
      console.log(result.message);
      return result.exitCode;
    }
    if (subcommand === 'add-upload') {
      const result = await runBackendAddUpload();
      console.log(result.message);
      return result.exitCode;
    }
  }
  return 1;
}

/**
 * Run as the bin only when this module is the process entrypoint — not when a test (or
 * any other module) imports its exported helpers. Guards against `main()` calling
 * `process.exit` during unit tests of {@link resolveTemplatesSource} / {@link cloneMirror}.
 */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((_error) => {
      process.exit(1);
    });
}
