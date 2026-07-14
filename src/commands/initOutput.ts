import type { PackageManager } from './initTypes';

/**
 * Print a clear init failure.
 *
 * @param message - Human-readable reason the command cannot continue.
 * @returns Exit code for the failed command.
 * @example
 * const code = writeInitFailure('Could not detect project type.');
 */
export const writeInitFailure = (message: string): number => {
  process.stderr.write(`❌ ${message}\n`);
  return 1;
};

/**
 * Print the successful init summary.
 *
 * @param pm - Detected package manager.
 * @returns Void after writing the summary.
 * @example
 * writeInitSuccess('pnpm');
 */
export const writeInitSuccess = (pm: PackageManager): void => {
  process.stdout.write('\n');
  process.stdout.write('🎉 Done. Your project now has VybeKiit guardrails:\n');
  process.stdout.write('   • Claude Code hooks enforce rules at runtime\n');
  process.stdout.write('   • Multi-platform agent configs (Kiro, Cursor, Codex, Gemini)\n');
  process.stdout.write('   • CI pipeline gates all merges to main\n');
  process.stdout.write('   • Pre-push hook verifies locally before push\n');
  process.stdout.write('   • Secrets are blocked from source files\n');
  process.stdout.write('\n');
  process.stdout.write(`   Next: run \`${pm} install\` then \`${pm} run verify\`\n`);
  process.stdout.write('\n');
  process.stdout.write('   Platform configs generated:\n');
  process.stdout.write('     .kiro/steering/vybekiit.md   -> Kiro\n');
  process.stdout.write('     .cursor/rules/vybekiit.mdc   -> Cursor\n');
  process.stdout.write('     AGENTS.md                    -> OpenAI Codex\n');
  process.stdout.write('     GEMINI.md                    -> Gemini CLI\n');
  process.stdout.write('     CLAUDE.md + .claude/hooks/   -> Claude Code\n');
};
