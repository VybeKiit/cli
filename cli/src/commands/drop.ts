import { access, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTemplatesSource } from '../lib/resolveTemplates';
import { isTemplateName, TEMPLATES, type TemplateName } from '../lib/scaffold';
import { isInteractive } from '../prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Directories to skip when dropping a template.
 * More permissive than scaffold — we keep .turbo, scripts/dev, etc.
 * Only skip true build artifacts and installed deps.
 */
const DROP_SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'test-results', '.expo']);

/** Check if a path should be copied during a drop operation. */
function shouldCopyDropPath(src: string): boolean {
  const parts = src.split(/[/\\]/);
  return !parts.some((part) => DROP_SKIP_DIRS.has(part));
}

/**
 * `vybekiit drop` — Drop/clone a VybeKiit template into ANY directory.
 *
 * The easiest way for any AI agent (Claude Code, Codex, Gemini, Cline, etc.) to
 * get a VybeKiit template into a project. Works headless (arguments) or interactive (TUI).
 *
 * ## Usage
 *
 * ### Arguments (headless — perfect for AI agents):
 *   vybekiit drop mobile ~/Projects/my-app
 *   vybekiit drop web .
 *   vybekiit drop backend /path/to/project --force
 *   vybekiit drop extension ./my-ext --merge
 *
 * ### Interactive (TUI):
 *   vybekiit drop
 *   → Shows template picker
 *   → Asks for destination
 *   → Confirms and drops
 *
 * ## Modes:
 *   --force    Overwrite existing files without asking
 *   --merge    Merge template into existing project (skip existing files)
 *   --dry-run  Show what would be copied without writing
 *   --json     Output result as JSON (for agent toolchains)
 *
 * ## For AI Agents:
 * When the user/vibe-coder tells their agent "use the mobile template" or
 * "start a new expo app with VybeKiit", the agent should run:
 *   vybekiit drop mobile /path/to/project
 */
export async function runDrop(args: string[]): Promise<number> {
  // Parse flags
  const flags = {
    force: args.includes('--force'),
    merge: args.includes('--merge'),
    dryRun: args.includes('--dry-run'),
    json: args.includes('--json'),
  };
  const positional = args.filter((a) => !a.startsWith('--'));

  let template: TemplateName | undefined;
  let destPath: string | undefined;

  // --- Resolve template ---
  if (positional[0] && isTemplateName(positional[0])) {
    template = positional[0] as TemplateName;
    destPath = positional[1];
  } else if (positional[0] && !isTemplateName(positional[0])) {
    // Maybe they gave path first? Or invalid template name
    if (positional[1] && isTemplateName(positional[1])) {
      // Swapped order: vybekiit drop ./path mobile
      template = positional[1] as TemplateName;
      destPath = positional[0];
    } else {
      // Just a path, need to pick template
      destPath = positional[0];
    }
  }

  // --- Interactive mode if missing info ---
  if (!template) {
    if (!isInteractive()) {
      const output = {
        error: true,
        message: `Template required. Available: ${TEMPLATES.join(', ')}`,
        usage: 'vybekiit drop <template> [path] [--force|--merge|--dry-run]',
        templates: TEMPLATES,
      };
      if (flags.json) {
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.error('❌ Template required.\n');
        console.error('Available templates:');
        for (const t of TEMPLATES) {
          console.error(`  • ${t}`);
        }
        console.error('\nUsage: vybekiit drop <template> [path] [--force|--merge]');
        console.error('\nExamples:');
        console.error('  vybekiit drop mobile ~/Projects/my-app');
        console.error('  vybekiit drop web .');
        console.error('  vybekiit drop backend ./api --force');
      }
      return 1;
    }

    // Interactive TUI
    const clack = await import('@clack/prompts');
    clack.intro('VybeKiit — drop a template');

    const picked = await clack.select({
      message: 'Which template?',
      options: [
        {
          value: 'web',
          label: '🌐 Web (Next.js)',
          hint: 'Full-stack: marketing + dashboard + API',
        },
        {
          value: 'spa',
          label: '📊 Admin SPA (Vite + React)',
          hint: 'Dashboard that pairs with backend',
        },
        { value: 'mobile', label: '📱 Mobile (Expo)', hint: 'iOS + Android + Web' },
        { value: 'extension', label: '🧩 Browser Extension (WXT)', hint: 'Chrome/Firefox/Safari' },
        {
          value: 'backend',
          label: '⚡ Backend API (Express)',
          hint: 'REST API for mobile/SPA/extension',
        },
      ],
    });

    if (clack.isCancel(picked)) {
      clack.cancel('Cancelled.');
      return 1;
    }
    template = picked as TemplateName;

    if (!destPath) {
      const dest = await clack.text({
        message: 'Where to drop it?',
        placeholder: `./${template}`,
        defaultValue: `./${template}`,
        validate: (v) => (v.trim() ? undefined : 'Path is required'),
      });
      if (clack.isCancel(dest)) {
        clack.cancel('Cancelled.');
        return 1;
      }
      destPath = dest as string;
    }

    // Confirm
    const mode = flags.force ? 'force' : flags.merge ? 'merge' : 'new';
    const confirm = await clack.confirm({
      message: `Drop "${template}" → ${resolve(destPath)}${mode === 'new' ? '' : ` (${mode})`}?`,
    });
    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel('Cancelled.');
      return 1;
    }
  }

  // Default destination = ./<template>
  if (!destPath) {
    destPath = `./${template}`;
  }

  const dest = resolve(process.cwd(), destPath);

  // --- Resolve template source ---
  let cleanup: (() => Promise<void>) | undefined;
  let source: string;
  try {
    // First try: monorepo-local templates (dev mode)
    const monorepoTemplates = join(HERE, '..', '..', '..', 'templates');
    try {
      await access(join(monorepoTemplates, template));
      source = monorepoTemplates;
    } catch {
      // Second try: standard resolution (env var → local → gh clone)
      const resolved = await resolveTemplatesSource(template);
      source = resolved.source;
      cleanup = resolved.cleanup;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Could not resolve template source';
    if (flags.json) {
      console.log(JSON.stringify({ error: true, message: msg }));
    } else {
      console.error(`❌ ${msg}`);
    }
    return 1;
  }

  const templateDir = join(source, template);

  try {
    // --- Check destination ---
    let destExists = false;
    let destHasFiles = false;
    try {
      await access(dest);
      destExists = true;
      const contents = await readdir(dest);
      destHasFiles = contents.length > 0;
    } catch {
      // Doesn't exist — perfect
    }

    if (destHasFiles && !flags.force && !flags.merge) {
      if (flags.json) {
        console.log(
          JSON.stringify({
            error: true,
            message: `Destination ${dest} is not empty. Use --force to overwrite or --merge to keep existing files.`,
          }),
        );
      } else {
        console.error(`❌ Destination is not empty: ${dest}`);
        console.error('   Use --force to overwrite all, or --merge to skip existing files.');
      }
      return 1;
    }

    // --- Dry run ---
    if (flags.dryRun) {
      const files = await listTemplateFiles(templateDir);
      if (flags.json) {
        console.log(
          JSON.stringify(
            {
              dryRun: true,
              template,
              dest,
              mode: flags.force ? 'force' : flags.merge ? 'merge' : 'new',
              fileCount: files.length,
              files: files.slice(0, 50), // Cap for readability
              ...(files.length > 50 ? { truncated: true, totalFiles: files.length } : {}),
            },
            null,
            2,
          ),
        );
      } else {
        console.log(`\n📋 Dry run: would drop "${template}" → ${dest}\n`);
        console.log(
          `   Mode: ${flags.force ? 'force (overwrite)' : flags.merge ? 'merge (skip existing)' : 'new'}`,
        );
        console.log(`   Files: ${files.length}\n`);
        for (const f of files.slice(0, 30)) {
          console.log(`   ${f}`);
        }
        if (files.length > 30) {
          console.log(`   ... and ${files.length - 30} more`);
        }
      }
      return 0;
    }

    // --- Create destination ---
    await mkdir(dest, { recursive: true });

    // --- Copy template ---
    const copyMode = flags.merge ? 'merge' : 'overwrite';
    let copiedCount = 0;
    const skippedCount = 0;

    await cp(templateDir, dest, {
      recursive: true,
      force: !flags.merge, // force=false in merge mode preserves existing
      filter: (src) => {
        if (!shouldCopyDropPath(src)) return false;
        copiedCount++;
        return true;
      },
    });

    // --- Pin @vybekiit/* deps to npm version ---
    await pinDeps(dest);

    // --- Post-drop: detect environment ---
    const postActions: string[] = [];
    if (template === 'mobile' && process.platform === 'darwin') {
      postActions.push('Run setup-mobile-env.sh to verify Xcode + iOS toolchain');
    }
    postActions.push(`cd ${destPath} && npm install`);
    postActions.push('Check .env.example and create .env with your values');

    // --- Output ---
    if (flags.json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            template,
            dest,
            mode: copyMode,
            postActions,
            agentConfigs: getAgentConfigsForTemplate(template),
          },
          null,
          2,
        ),
      );
    } else {
      console.log('');
      console.log(`✅ Dropped "${template}" template → ${dest}`);
      console.log('');
      console.log('   Includes:');
      console.log('   • Full project source code');
      console.log('   • .claude/ hooks (35 guardrails)');
      console.log('   • Multi-platform agent configs (14 platforms)');
      console.log('   • CI pipeline (.github/workflows/)');
      console.log('   • Security guardrails (SECURITY.md)');
      console.log('');
      console.log('   Next steps:');
      for (const action of postActions) {
        console.log(`   → ${action}`);
      }
      console.log('');
      console.log('   Agent configs ready for:');
      const configs = getAgentConfigsForTemplate(template);
      for (const [agent, path] of Object.entries(configs)) {
        console.log(`     ${agent.padEnd(14)} → ${path}`);
      }
      console.log('');
    }

    return 0;
  } finally {
    await cleanup?.();
  }
}

/** List all files that would be copied from a template (for --dry-run). */
async function listTemplateFiles(dir: string, prefix = ''): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!shouldCopyDropPath(rel)) continue;
      if (entry.isDirectory()) {
        const sub = await listTemplateFiles(join(dir, entry.name), rel);
        results.push(...sub);
      } else {
        results.push(rel);
      }
    }
  } catch {
    // Dir doesn't exist
  }
  return results;
}

/** Pin workspace:* deps to a publishable npm version. */
async function pinDeps(dest: string): Promise<void> {
  const pkgPath = join(dest, 'package.json');
  try {
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    for (const field of ['dependencies', 'devDependencies'] as const) {
      const deps = pkg[field];
      if (!deps) continue;
      for (const [key, value] of Object.entries(deps as Record<string, string>)) {
        if (value === 'workspace:*' || value.startsWith('workspace:')) {
          (deps as Record<string, string>)[key] = '*';
        }
      }
    }
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  } catch {
    // No package.json — fine
  }
}

/** Map of agent → config file path for a given template. */
function getAgentConfigsForTemplate(_template: TemplateName): Record<string, string> {
  return {
    'Claude Code': '.claude/settings.json + hooks/',
    Kiro: '.kiro/steering/vybekiit.md',
    Cursor: '.cursor/rules/vybekiit.mdc',
    Codex: 'AGENTS.md',
    Gemini: 'GEMINI.md',
    Copilot: '.github/copilot-instructions.md',
    Windsurf: '.windsurfrules',
    Cline: '.clinerules/rules.md',
    Kilo: '.kilo/rules/vybekiit.md',
    Aider: 'CONVENTIONS.md',
    Roo: '.roo/rules.md',
    Augment: '.augment-guidelines',
    Zed: '.zed/rules.md',
    Junie: '.junie/guidelines.md',
  };
}
