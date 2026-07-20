import type { TemplateName } from '../lib/scaffold';
import { listTemplateFiles } from './dropFiles';
import { DROP_MODE_LABELS, type DropContext, type DropFlags, dropMode } from './dropTypes';

/**
 * Print the destination-not-empty failure.
 *
 * @param flags - Parsed `drop` flags controlling output format.
 * @param dest - Absolute destination path.
 * @returns Exit code for the failed command.
 * @example
 * const code = writeDestinationNotEmpty(flags, '/tmp/app');
 */
export const writeDestinationNotEmpty = (flags: DropFlags, dest: string): number => {
  if (flags.json) {
    process.stdout.write(
      `${JSON.stringify({
        error: true,
        message: `Destination ${dest} is not empty. Use --force to overwrite or --merge to keep existing files.`,
      })}\n`,
    );
    return 1;
  }

  process.stderr.write(`❌ Destination is not empty: ${dest}\n`);
  process.stderr.write(
    `${'   Use --force to overwrite all, or --merge to skip existing files.'}\n`,
  );
  return 1;
};

/**
 * Print a dry-run preview without writing files.
 *
 * @param context - Resolved drop context.
 * @returns Exit code for the dry-run command.
 * @example
 * const code = await runDropDryRun(context);
 */
export const runDropDryRun = async (context: DropContext): Promise<number> => {
  const { dest, flags, template, templateDir } = context;
  const files = await listTemplateFiles(templateDir);

  if (flags.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          dryRun: true,
          template,
          dest,
          mode: dropMode(flags),
          fileCount: files.length,
          files: files.slice(0, 50),
          ...(files.length > 50 ? { truncated: true, totalFiles: files.length } : {}),
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  }

  process.stdout.write(`\n📋 Dry run: would drop "${template}" -> ${dest}\n\n`);
  process.stdout.write(`   Mode: ${DROP_MODE_LABELS[dropMode(flags)]}\n`);
  process.stdout.write(`   Files: ${files.length}\n\n`);
  for (const file of files.slice(0, 30)) {
    process.stdout.write(`   ${file}\n`);
  }
  if (files.length > 30) {
    process.stdout.write(`   ... and ${files.length - 30} more\n`);
  }
  return 0;
};

/**
 * Build the post-drop instructions shown to the caller.
 *
 * @param template - Dropped template.
 * @param destPath - User-facing destination path.
 * @returns Ordered next steps for the created project.
 * @example
 * const actions = buildPostActions('web', './my-app');
 */
export const buildPostActions = (template: TemplateName, destPath: string): string[] => {
  const postActions: string[] = [];
  if (template === 'mobile' && process.platform === 'darwin') {
    postActions.push('Run setup-mobile-env.sh to verify Xcode + iOS toolchain');
  }
  postActions.push(`cd ${destPath} && npm install`);
  postActions.push('Check .env.example and create .env with your values');
  return postActions;
};

/**
 * Map supported assistant products to their config file paths.
 *
 * @returns Agent config labels and relative paths.
 * @example
 * const configs = getAgentConfigsForTemplate();
 */
const getAgentConfigsForTemplate = (): Record<string, string> => ({
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
});

/**
 * Print the successful drop response.
 *
 * @param context - Resolved drop context.
 * @param postActions - Ordered next steps for the created project.
 * @returns Void after writing to stdout.
 */
export const writeDropSuccess = (context: DropContext, postActions: readonly string[]): void => {
  const { dest, flags, template } = context;
  if (flags.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          success: true,
          template,
          dest,
          mode: flags.merge ? 'merge' : 'overwrite',
          postActions,
          agentConfigs: getAgentConfigsForTemplate(),
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write('\n');
  process.stdout.write(`✅ Dropped "${template}" template -> ${dest}\n`);
  process.stdout.write('\n');
  process.stdout.write('   Includes:\n');
  process.stdout.write('   • Full project source code\n');
  process.stdout.write('   • .claude/ hooks (35 guardrails)\n');
  process.stdout.write('   • Multi-platform agent configs (14 platforms)\n');
  process.stdout.write('   • CI pipeline (.github/workflows/)\n');
  process.stdout.write('   • Security guardrails (SECURITY.md)\n');
  process.stdout.write('\n');
  process.stdout.write('   Next steps:\n');
  for (const action of postActions) {
    process.stdout.write(`   -> ${action}\n`);
  }
  process.stdout.write('\n');
  process.stdout.write('   Agent configs ready for:\n');
  const configs = getAgentConfigsForTemplate();
  for (const [agent, path] of Object.entries(configs)) {
    process.stdout.write(`     ${agent.padEnd(14)} -> ${path}\n`);
  }
  process.stdout.write('\n');
};

/**
 * Print a template resolution or copy failure.
 *
 * @param flags - Parsed `drop` flags controlling output format.
 * @param error - Unknown caught failure.
 * @returns Exit code for the failed command.
 * @example
 * const code = writeDropError(flags, error);
 */
export const writeDropError = (flags: DropFlags, error: unknown): number => {
  const message = error instanceof Error ? error.message : 'Could not resolve template source';
  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ error: true, message })}\n`);
    return 1;
  }

  process.stderr.write(`❌ ${message}\n`);
  return 1;
};
