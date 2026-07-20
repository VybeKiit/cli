import process from 'node:process';
import { confirm, isCancel } from '@clack/prompts';
import { isInteractive } from '../prompts/tty';
import { installAwareness } from './awareness';
import { readCliVersion } from './cliVersion';
import { checkEntitlement, type EntitlementResult, formatEntitlementBlock } from './entitlement';
import { makeExec } from './exec';
import { resolveGlobalPaths } from './globalPaths';
import { isGloballyInstalled, readGlobalStatus } from './globalStatus';
import { installGlobalMcp } from './installGlobalMcp';
import { installGlobalSkills } from './installGlobalSkills';
import { readInstallState, writeInstallState } from './installState';
import { sampleManagedSkillNames } from './managedSkills';

/** Everything the global install did, for reporting + verification. */
export type GlobalInstallSummary = {
  readonly skillsInstalled: number;
  readonly skillsSkipped: number;
  /** Recognizable sample of skill names that landed (smoke check for the buyer). */
  readonly skillSample: readonly string[];
  /** Absolute path skills were written to. */
  readonly skillsPath: string;
  readonly mcpEnabled: readonly string[];
  readonly mcpRefreshed: readonly string[];
  readonly mcpNeedsKey: readonly string[];
  readonly claudeMissing: boolean;
  readonly commandInstalled: boolean;
  /** CLI version that just provisioned (from package.json / npm@latest). */
  readonly version: string;
  /** Prior stamp version when this was a re-run update; null on first install. */
  readonly previousVersion: string | null;
};

/**
 * Format the success banner shown after a global install. Written for the non-technical
 * buyer: it names the visible signals so they can tell it worked.
 *
 * @param summary - What the install did.
 * @returns Lines to print in order.
 */
export const formatGlobalInstallSummary = (summary: GlobalInstallSummary): string[] => {
  const isUpdate = summary.previousVersion !== null && summary.previousVersion !== summary.version;
  const isRerun = summary.previousVersion !== null && summary.previousVersion === summary.version;
  const skillsEmpty = summary.skillsInstalled === 0 && summary.skillSample.length === 0;

  let headline = `✅ VybeKiit ${summary.version} is now set up globally in Claude Code.`;
  if (skillsEmpty) {
    headline = `✗ VybeKiit ${summary.version} global setup did not land any managed skills.`;
  } else if (isUpdate) {
    headline = `✅ VybeKiit updated ${summary.previousVersion} → ${summary.version}`;
  } else if (isRerun) {
    headline = `✅ VybeKiit ${summary.version} re-applied (already latest)`;
  }

  const lines = [
    '',
    headline,
    '',
    `  • Skills   ${summary.skillsInstalled} installed in ${summary.skillsPath} (available in every project)`,
  ];
  if (summary.skillSample.length > 0) {
    lines.push(`             smoke: ${summary.skillSample.join(', ')}`);
  }
  if (skillsEmpty) {
    lines.push(
      '             No managed skills on disk — Claude Code will not load kit skills until this is fixed.',
      '             Re-run: `npx -y vybekiit@latest global-install --yes` (or rebuild the CLI so dist/global-skills exists).',
    );
  }
  if (summary.claudeMissing) {
    lines.push('  • MCP      skipped — the `claude` command was not found on your PATH');
  } else {
    const enabledLabel =
      summary.mcpEnabled.length > 0 ? summary.mcpEnabled.join(', ') : 'none newly added';
    lines.push(`  • MCP      ${enabledLabel} (browser automation + live docs everywhere)`);
    if (summary.mcpRefreshed.length > 0) {
      lines.push(`             refreshed: ${summary.mcpRefreshed.join(', ')}`);
    }
    if (summary.mcpNeedsKey.length > 0) {
      lines.push(
        `             ${summary.mcpNeedsKey.length} more need an API key — run \`vybekiit env wizard\``,
      );
    }
  }
  if (skillsEmpty) {
    lines.push('');
  } else {
    lines.push(
      '  • Command  type /vybekiit in Claude Code to see status anytime',
      '  • Claude now knows it is VybeKiit-enabled in every project',
      '',
      'To see it: restart Claude Code (or run `claude` once) to approve the new MCP servers,',
      'then type /vybekiit to confirm.',
      '',
      'Re-run anytime to update:  curl -fsSL https://vybekiit.com/install.sh | sh',
      '                     or:  npx -y vybekiit@latest update',
      '',
    );
  }
  return lines;
};

/**
 * Provision VybeKiit globally: skills, MCP servers, and awareness signals. Called from
 * `vybekiit setup` (always `--yes` after entitlement), `vybekiit global-install`,
 * `vybekiit update`, and the install.sh path. Re-runs are the auto-updater: always pull
 * managed skills from this CLI build, force-refresh zero-config MCP defs, and stamp the
 * installed version.
 *
 * Exits non-zero when entitlement fails **or** when zero managed skills land (so a broken
 * bundle / skipped copy cannot look like success).
 *
 * @param args - Raw args; `--yes`/`-y` skips the confirmation prompt.
 * @param gate - Buyer-entitlement check (defaults to the real `gh`-backed one; injected in tests).
 * @returns Process exit code (1 when the buyer gate blocks the install or skills are empty).
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
        'Skipping global setup (non-interactive). Run `vybekiit global-install --yes` or `vybekiit update` to provision Claude Code globally.\n',
      );
      return 0;
    }
    const proceed = await confirm({
      message:
        'Set up / update VybeKiit globally in Claude Code? Refreshes skills + browser automation in every project.',
      initialValue: true,
    });
    if (isCancel(proceed) || proceed !== true) {
      process.stdout.write(
        'Skipped global setup. You can run `vybekiit update` or `vybekiit global-install` anytime.\n',
      );
      return 0;
    }
  }

  const paths = resolveGlobalPaths();
  const previous = await readInstallState(paths.configDir);
  const version = await readCliVersion();
  // Re-run = auto-update: re-apply zero-config MCP defs so install.sh always tracks latest.
  const isRerun = previous !== null;

  const skills = await installGlobalSkills(paths);
  const mcp = await installGlobalMcp({
    exec: makeExec('claude'),
    env: process.env,
    forceRefresh: isRerun,
  });
  const awareness = await installAwareness(paths);

  const postStatus = await readGlobalStatus(paths);
  const skillSample =
    postStatus.skillSample.length > 0
      ? postStatus.skillSample
      : sampleManagedSkillNames(skills.installed);

  const summary: GlobalInstallSummary = {
    skillsInstalled: skills.installed.length,
    skillsSkipped: skills.skipped.length,
    skillSample,
    skillsPath: skills.path,
    mcpEnabled: mcp.enabled,
    mcpRefreshed: mcp.refreshed,
    mcpNeedsKey: mcp.needsKey,
    claudeMissing: mcp.claudeMissing,
    commandInstalled: awareness.commandWritten,
    version,
    previousVersion: previous?.version ?? null,
  };

  for (const line of formatGlobalInstallSummary(summary)) {
    process.stdout.write(`${line}\n`);
  }

  // Hard fail: never stamp install-state when Claude has nothing to load. Doctor will also
  // exit 1 until a later run lands managed skills.
  if (!isGloballyInstalled(postStatus)) {
    process.stderr.write(
      'VybeKiit global install incomplete: expected managed skills + /vybekiit + CLAUDE.md block.\n',
    );
    return 1;
  }

  await writeInstallState(paths.configDir, version);
  return 0;
};
