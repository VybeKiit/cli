import process from 'node:process';
import { confirm, isCancel } from '@clack/prompts';
import { isInteractive } from '../prompts/tty';
import { installAwareness } from './awareness';
import { checkEntitlement, type EntitlementResult, formatEntitlementBlock } from './entitlement';
import { resolveGlobalPaths } from './globalPaths';
import { installGlobalMcp } from './installGlobalMcp';
import { installGlobalSkills } from './installGlobalSkills';

/** Everything the global install did, for reporting + verification. */
export type GlobalInstallSummary = {
  readonly skillsInstalled: number;
  readonly skillsSkipped: number;
  readonly mcpEnabled: readonly string[];
  readonly mcpNeedsKey: readonly string[];
  readonly claudeMissing: boolean;
  readonly commandInstalled: boolean;
};

/**
 * Format the success banner shown after a global install. Written for the non-technical
 * buyer: it names the visible signals so they can tell it worked.
 *
 * @param summary - What the install did.
 * @returns Lines to print in order.
 * @example
 * formatGlobalInstallSummary({ skillsInstalled: 119, ... });
 */
export const formatGlobalInstallSummary = (summary: GlobalInstallSummary): string[] => {
  const lines = [
    '',
    '✅ VybeKiit is now set up globally in Claude Code.',
    '',
    `  • Skills   ${summary.skillsInstalled} installed in ~/.claude/skills (available in every project)`,
  ];
  if (summary.claudeMissing) {
    lines.push('  • MCP      skipped — the `claude` command was not found on your PATH');
  } else {
    lines.push(
      `  • MCP      ${summary.mcpEnabled.length > 0 ? summary.mcpEnabled.join(', ') : 'none'} enabled (browser automation + live docs everywhere)`,
    );
    if (summary.mcpNeedsKey.length > 0) {
      lines.push(
        `             ${summary.mcpNeedsKey.length} more need an API key — run \`vybekiit env wizard\``,
      );
    }
  }
  lines.push(
    '  • Command  type /vybekiit in Claude Code to see status anytime',
    '  • Claude now knows it is VybeKiit-enabled in every project',
    '',
    'To see it: restart Claude Code (or run `claude` once) to approve the new MCP servers,',
    'then type /vybekiit to confirm.',
    '',
  );
  return lines;
};

/**
 * Provision VybeKiit globally: skills, MCP servers, and awareness signals. Called from
 * `vybekiit setup` (with one confirm) and runnable directly as `vybekiit global-install`.
 *
 * @param args - Raw args; `--yes`/`-y` skips the confirmation prompt.
 * @param gate - Buyer-entitlement check (defaults to the real `gh`-backed one; injected in tests).
 * @returns Process exit code (1 when the buyer gate blocks the install).
 * @example
 * const code = await runGlobalInstall(['--yes']);
 */
export const runGlobalInstall = async (
  args: readonly string[],
  gate: () => Promise<EntitlementResult> = checkEntitlement,
): Promise<number> => {
  // Buyer gate first: reuse the scaffolder's entitlement boundary (read access to a private
  // VybeKiit surface mirror) before provisioning anything globally. Fail-closed, no bypass.
  const entitlement = await gate();
  if (!entitlement.entitled) {
    for (const line of formatEntitlementBlock(entitlement)) {
      process.stderr.write(`${line}\n`);
    }
    return 1;
  }

  const skipPrompt = args.includes('--yes') || args.includes('-y');

  if (!skipPrompt) {
    if (!isInteractive()) {
      process.stdout.write(
        'Skipping global setup (non-interactive). Run `vybekiit global-install --yes` to provision Claude Code globally.\n',
      );
      return 0;
    }
    const proceed = await confirm({
      message:
        'Set up VybeKiit globally in Claude Code? Adds skills + browser automation to every project.',
      initialValue: true,
    });
    if (isCancel(proceed) || proceed !== true) {
      process.stdout.write(
        'Skipped global setup. You can run `vybekiit global-install` anytime.\n',
      );
      return 0;
    }
  }

  const paths = resolveGlobalPaths();
  const skills = await installGlobalSkills(paths);
  const mcp = await installGlobalMcp();
  const awareness = await installAwareness(paths);

  const summary: GlobalInstallSummary = {
    skillsInstalled: skills.installed.length,
    skillsSkipped: skills.skipped.length,
    mcpEnabled: mcp.enabled,
    mcpNeedsKey: mcp.needsKey,
    claudeMissing: mcp.claudeMissing,
    commandInstalled: awareness.commandWritten,
  };

  for (const line of formatGlobalInstallSummary(summary)) {
    process.stdout.write(`${line}\n`);
  }
  return 0;
};
