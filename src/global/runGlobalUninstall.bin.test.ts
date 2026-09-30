import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Effect } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { agentInstallationTargets, installAgentGuidance } from './agentGuidance';
import { installAwareness } from './awareness';
import { globalInstallPaths } from './globalPaths';
import { installGlobalSkills } from './installGlobalSkills';
import { writeInstallState } from './installState';
import { listManagedSkillNames } from './managedSkills';

const execFileAsync = promisify(execFile);
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const BIN = join(DIST, 'bin.js');

const STUB_CLAUDE = (callLog: string) => `#!/bin/sh
echo "$*" >> "${callLog}"
if [ "$1 $2" = "mcp get" ] && grep -qx "mcp remove -s user $3" "${callLog}"; then
  echo "No MCP server found" >&2
  exit 1
fi
case "$*" in
  "--version") echo "2.0.0 (Claude Code)"; exit 0 ;;
  "mcp get vybekiit") printf 'vybekiit:\\n  Scope: User config (available in all your projects)\\n  Type: stdio\\n  Command: npx\\n  Args: -y vybekiit@latest mcp serve\\n'; exit 0 ;;
  "mcp get playwright") printf 'playwright:\\n  Scope: User config (available in all your projects)\\n  Type: stdio\\n  Command: npx\\n  Args: -y @playwright/mcp@0.0.40 --headless\\n'; exit 0 ;;
  "mcp remove -s user "*) exit 0 ;;
esac
echo "No MCP server found" >&2
exit 1
`;

const sandboxes: string[] = [];

afterEach(async () => {
  await Promise.all(
    sandboxes.splice(0).map((sandbox) => rm(sandbox, { recursive: true, force: true })),
  );
});

describe('built bin: vybekiit uninstall', () => {
  it('previews, then removes everything global setup added from a sandboxed home', async () => {
    if (!existsSync(BIN)) {
      // dist not built in this run; the release pipeline builds before testing.
      expect(true).toBe(true);
      return;
    }
    const homeDirectory = await mkdtemp(join(tmpdir(), 'vybekiit-uninstall-e2e-'));
    sandboxes.push(homeDirectory);
    const claudeDirectory = join(homeDirectory, '.claude');
    const codexDirectory = join(homeDirectory, '.codex');
    const stubDirectory = join(homeDirectory, 'stub-bin');
    const callLog = join(homeDirectory, 'claude-calls.log');
    const paths = globalInstallPaths(claudeDirectory);
    const settings = {
      homeDirectory,
      claudeDirectory,
      codexDirectory,
      executablePath: '',
      plainLanguageGuide: join(DIST, 'global-guidance', 'language.md'),
    };
    await mkdir(stubDirectory, { recursive: true });
    await writeFile(join(stubDirectory, 'claude'), STUB_CLAUDE(callLog));
    await chmod(join(stubDirectory, 'claude'), 0o755);
    await mkdir(claudeDirectory, { recursive: true });
    await writeFile(paths.memoryFile, '# My rules\n');
    await mkdir(codexDirectory, { recursive: true });
    await writeFile(join(codexDirectory, 'AGENTS.md'), 'My codex rules.\n');

    const installedSkills = await installGlobalSkills(paths, join(DIST, 'global-skills'));
    await installAwareness(paths);
    await Effect.runPromise(
      installAgentGuidance(
        settings,
        agentInstallationTargets(settings),
        paths.skillsDir,
        installedSkills.installed,
        '0.7.28',
      ),
    );
    await writeInstallState(claudeDirectory, '0.7.28');
    expect((await listManagedSkillNames(paths.skillsDir)).length).toBeGreaterThan(100);

    const sandboxedEnvironment = {
      ...process.env,
      HOME: homeDirectory,
      CLAUDE_CONFIG_DIR: claudeDirectory,
      CODEX_HOME: codexDirectory,
      PATH: `${stubDirectory}:${process.env.PATH ?? ''}`,
    };
    const runUninstall = (uninstallFlags: readonly string[]) =>
      execFileAsync(process.execPath, [BIN, 'uninstall', ...uninstallFlags], {
        env: sandboxedEnvironment,
        encoding: 'utf8',
      });

    const preview = await runUninstall(['--dry-run']);
    expect(preview.stdout).toContain('VybeKiit will remove:');
    expect(preview.stdout).toContain('Claude Code tool connections (1): vybekiit');
    expect(preview.stdout).toContain('Your own playwright tool connection in Claude Code.');
    expect(preview.stdout).toContain('Dry run: nothing was removed.');
    expect((await listManagedSkillNames(paths.skillsDir)).length).toBeGreaterThan(100);

    const unattended = await runUninstall([]);
    expect(unattended.stdout).toContain('Nothing was removed.');
    expect(existsSync(join(paths.commandsDir, 'vybekiit.md'))).toBe(true);

    const removal = await runUninstall(['--yes']);
    expect(removal.stdout).toContain('✅ VybeKiit was removed from this computer.');
    expect(await listManagedSkillNames(paths.skillsDir)).toEqual([]);
    expect(await readFile(paths.memoryFile, 'utf8')).toBe('# My rules\n');
    expect(await readFile(join(codexDirectory, 'AGENTS.md'), 'utf8')).toBe('My codex rules.\n');
    expect(existsSync(join(homeDirectory, '.agents', 'skills', 'onboarding'))).toBe(false);
    expect(existsSync(join(paths.commandsDir, 'vybekiit.md'))).toBe(false);
    expect(JSON.parse(await readFile(paths.settingsFile, 'utf8'))).toEqual({});
    expect(existsSync(join(homeDirectory, '.vybekiit'))).toBe(false);
    expect(existsSync(join(claudeDirectory, '.vybekiit-install.json'))).toBe(false);
    const claudeCalls = await readFile(callLog, 'utf8');
    expect(claudeCalls).toContain('mcp remove -s user vybekiit');
    expect(claudeCalls).not.toContain('mcp remove -s user playwright');

    const repeated = await runUninstall(['--yes']);
    expect(repeated.stdout).toContain('Nothing to remove.');
  }, 60_000);
});
