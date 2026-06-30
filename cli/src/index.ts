import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  runBackendAddCrud,
  runBackendAddRoute,
  runBackendAddUpload,
  runScaffoldBackend,
} from './commands/backend-cli';
import { runCheckGoals } from './commands/check-goals';
import { runCheckAgentLayer } from './commands/check-agent-layer';
import { runDocFallback } from './commands/doc-fallback';
import { runDoctor } from './commands/doctor';
import { runNew } from './commands/new';
import { runPlanDataModel } from './commands/plan-data-model-cmd';
import { runPlanReadiness } from './commands/plan-readiness';
import { runPlanSetup } from './commands/plan-setup-cmd';
import { runRenderAgentLayer } from './commands/render-agent-layer';
import { runSyncAgentLayer } from './commands/sync-agent-layer';
import { cloneMirror, resolveTemplatesSource } from './lib/resolve-templates';
import { runEnvWizard } from './prompts/env-wizard';
import { isInteractive } from './prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));

const _HELP = `vybekiit — scaffold a VybeKiit template into your own repo

Usage:
  vybekiit new [template] [directory]
  vybekiit scaffold backend [directory]
  vybekiit doctor
  vybekiit sync-agent-layer [template]
  vybekiit render-agent-layer
  vybekiit check-goals [template]
  vybekiit plan-readiness <feature> [template]
  vybekiit plan-setup <domain>
  vybekiit plan-data-model <entities.json> [provider]
  vybekiit check-agent-layer [template]
  vybekiit doc-fallback <tech-id>
  vybekiit env wizard
  vybekiit backend add-route <name>
  vybekiit backend add-crud <resource>
  vybekiit backend add-upload

Templates:
  web         Next.js + shadcn (RTL-ready) + the agent layer   [available]
  mobile      Expo                                             [available]
  extension   WXT                                              [available]
  backend     Express MVC API for mobile/extension clients   [available]

Commands:
  new                 Scaffold a template (interactive menu when TTY)
  scaffold backend    Add Express API server to an existing project
  doctor              Set up + check the tools your app needs
  sync-agent-layer    Refresh agent instructions from the latest template mirror
  render-agent-layer  Regenerate marked sections from agent-kit
  check-goals         Validate goal-index ↔ skills (JSON, exit 1 on drift)
  check-agent-layer   Validate agent-layer structure and compliance (JSON)
  plan-readiness      Feature readiness + orchestration steps (JSON)
  plan-setup          Plain-language setup checklist for a domain
  plan-data-model     Data model plan from entities JSON file
  doc-fallback        Official docs URLs when MCP or debug fails once (JSON)
  env wizard          Interactive .env setup (TTY only)
  backend add-route   Append a route + controller to backend/
  backend add-crud    Scaffold CRUD routes for a resource
  backend add-upload  Add multer upload route

Examples:
  vybekiit new
  vybekiit new web my-app
  vybekiit doc-fallback twilio
  vybekiit check-goals mobile

Options:
  -h, --help       Show this help
  -v, --version    Show the CLI version
`;

/** Read the CLI's own version from its package.json (also used to pin scaffolded deps). */
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
} from './lib/resolve-templates';

async function main(argv: string[]): Promise<number> {
  const [command, subcommand, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    return 0;
  }
  if (command === '--version' || command === '-v') {
    return 0;
  }
  if (command === 'new') {
    return runNew(rest);
  }
  if (command === 'doctor') {
    return await runDoctor();
  }
  if (command === 'sync-agent-layer') {
    const result = await runSyncAgentLayer(rest);
    for (const _line of result.lines) {
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
  if (command === 'doc-fallback') {
    const result = runDocFallback(rest);
    console.log(result.json);
    return result.exitCode;
  }
  if (command === 'env' && subcommand === 'wizard') {
    if (!isInteractive()) {
      console.error('env wizard requires an interactive terminal.');
      return 1;
    }
    return await runEnvWizard();
  }
  if (command === 'scaffold' && subcommand === 'backend') {
    const result = await runScaffoldBackend(rest, process.cwd(), await readVersion());
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
