import { existsSync } from 'node:fs';
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { it } from '@effect/vitest';
import { Effect } from 'effect';
import { expect } from 'vitest';
import { agentInstallationTargets, installAgentGuidance } from './agentGuidance';
import { installAwareness } from './awareness';
import type { ExecFn } from './exec';
import { globalInstallPaths } from './globalPaths';
import { installGlobalSkills } from './installGlobalSkills';
import { writeInstallState } from './installState';
import {
  applyGlobalUninstall,
  formatUninstallPlan,
  planGlobalUninstall,
} from './runGlobalUninstall';

const userScopedServer = (name: string, command: string, commandArguments: string) =>
  `${name}:\n  Scope: User config (available in all your projects)\n  Status: ✔ Connected\n  Type: stdio\n  Command: ${command}\n  Args: ${commandArguments}\n  Environment:\n`;

const claudeWithRegisteredServers = (claudeCalls: string[][]): ExecFn => {
  const registeredServers = new Map([
    ['vybekiit', userScopedServer('vybekiit', 'npx', '-y vybekiit@latest mcp serve')],
    ['context7', userScopedServer('context7', 'npx', '-y @upstash/context7-mcp@latest')],
    ['playwright', userScopedServer('playwright', 'npx', '-y @playwright/mcp@0.0.40 --headless')],
  ]);
  return (claudeArguments) => {
    claudeCalls.push([...claudeArguments]);
    const [subcommand, action, serverName = ''] = claudeArguments;
    const registeredServer = registeredServers.get(serverName);
    if (subcommand === 'mcp' && action === 'remove') {
      registeredServers.delete(claudeArguments.at(-1) ?? '');
    }
    if (subcommand === 'mcp' && action === 'get') {
      return Promise.resolve(
        registeredServer === undefined
          ? { code: 1, stdout: '', stderr: `No MCP server found with name: ${serverName}` }
          : { code: 0, stdout: registeredServer, stderr: '' },
      );
    }
    return Promise.resolve({ code: 0, stdout: '2.0.0 (Claude Code)', stderr: '' });
  };
};

const codexWithRegisteredServers = (codexCalls: string[][]): ExecFn => {
  const registeredServers = new Map([
    ['vybekiit', { command: 'npx', args: ['-y', 'vybekiit@latest', 'mcp', 'serve'] }],
    ['playwright', { command: 'npx', args: ['-y', '@playwright/mcp@latest'] }],
    ['context7', { command: 'node', args: ['my-context7.js'] }],
  ]);
  return (codexArguments) => {
    codexCalls.push([...codexArguments]);
    const [subcommand, action, serverName = ''] = codexArguments;
    if (subcommand === 'mcp' && action === 'remove') {
      registeredServers.delete(serverName);
    }
    const listedServers = [...registeredServers].map(([name, transport]) => ({
      name,
      enabled: true,
      transport: { type: 'stdio', ...transport, env: null, env_vars: [], cwd: null },
    }));
    const listing = subcommand === 'mcp' && action === 'list';
    return Promise.resolve({
      code: 0,
      stdout: listing ? JSON.stringify(listedServers) : 'codex-cli 0.162.1',
      stderr: '',
    });
  };
};

const missingCommand: ExecFn = () =>
  Promise.resolve({ code: 127, stdout: '', stderr: 'not found' });

it.scoped('removes everything global setup added and keeps what the user owns', () =>
  Effect.gen(function* () {
    const homeDirectory = yield* Effect.acquireRelease(
      Effect.promise(async () => {
        const scratchDirectory = join(process.cwd(), 'scripts', 'dev');
        await mkdir(scratchDirectory, { recursive: true });
        return mkdtemp(join(scratchDirectory, 'global-uninstall-'));
      }),
      (directory) => Effect.promise(() => rm(directory, { recursive: true, force: true })),
    );
    const settings = {
      homeDirectory,
      claudeDirectory: join(homeDirectory, '.claude'),
      codexDirectory: join(homeDirectory, '.codex'),
      executablePath: '',
      plainLanguageGuide: join(homeDirectory, 'bundled-language.md'),
    };
    const paths = globalInstallPaths(settings.claudeDirectory);
    const bundledSkills = join(homeDirectory, 'bundled-skills');
    const firstAppPath = join(homeDirectory, 'vybekiit-app');
    const guideDirectory = join(homeDirectory, '.vybekiit');
    const userSkillLink = join(homeDirectory, '.agents', 'skills', 'my-skill');
    yield* Effect.promise(async () => {
      await writeFile(settings.plainLanguageGuide, '| deploy | put your app online |\n');
      await mkdir(join(bundledSkills, 'vybekiit-feedback'), { recursive: true });
      await mkdir(join(bundledSkills, 'onboarding'), { recursive: true });
      await writeFile(
        join(bundledSkills, 'manifest.json'),
        JSON.stringify({ skills: ['vybekiit-feedback', 'onboarding'] }),
      );
      await writeFile(join(bundledSkills, 'vybekiit-feedback', 'SKILL.md'), 'kit feedback');
      await writeFile(join(bundledSkills, 'onboarding', 'SKILL.md'), 'kit onboarding');
      await mkdir(join(paths.skillsDir, 'my-skill'), { recursive: true });
      await writeFile(join(paths.skillsDir, 'my-skill', 'SKILL.md'), 'my own skill');
      await mkdir(join(homeDirectory, '.agents', 'skills'), { recursive: true });
      await symlink(join(paths.skillsDir, 'my-skill'), userSkillLink, 'junction');
      await writeFile(paths.memoryFile, '# My rules\nBe brief.\n');
      await mkdir(settings.codexDirectory, { recursive: true });
      await writeFile(join(settings.codexDirectory, 'AGENTS.md'), 'My codex rules.\n');
      await mkdir(join(homeDirectory, '.gemini'), { recursive: true });
      await writeFile(
        paths.settingsFile,
        `${JSON.stringify({ theme: 'dark', statusLine: { type: 'command', command: 'node ~/statusline.mjs' } }, null, 2)}\n`,
      );
      await mkdir(join(guideDirectory, 'benchmark-backups'), { recursive: true });
      await writeFile(join(guideDirectory, 'benchmark-backups', 'keep.txt'), 'mine');
      await writeFile(join(guideDirectory, 'feedback-consent.json'), '{"mode":"off"}\n');
      await mkdir(firstAppPath, { recursive: true });
      await writeFile(join(firstAppPath, 'package.json'), '{}\n');
    });
    const installedSkills = yield* Effect.promise(() => installGlobalSkills(paths, bundledSkills));
    yield* Effect.promise(() => installAwareness(paths));
    yield* installAgentGuidance(
      settings,
      agentInstallationTargets(settings),
      paths.skillsDir,
      installedSkills.installed,
      '0.7.28',
    );
    yield* Effect.promise(() => writeInstallState(paths.configDir, '0.7.28', { firstAppPath }));
    expect(existsSync(join(homeDirectory, '.gemini', 'GEMINI.md'))).toBe(true);
    expect(
      (yield* Effect.promise(() =>
        lstat(join(homeDirectory, '.agents', 'skills', 'onboarding')),
      )).isSymbolicLink(),
    ).toBe(true);

    const claudeCalls: string[][] = [];
    const codexCalls: string[][] = [];
    const assistantCommands = {
      claude: claudeWithRegisteredServers(claudeCalls),
      codex: codexWithRegisteredServers(codexCalls),
    };
    const plan = yield* planGlobalUninstall(settings, assistantCommands);
    const plannedRemovals = formatUninstallPlan(plan).join('\n');
    expect(plannedRemovals).toContain('Claude Code tool connections (2): vybekiit, context7');
    expect(plannedRemovals).toContain('Codex tool connections (2): vybekiit, playwright');
    expect(plan.keptNotes).toContain('Your own playwright tool connection in Claude Code.');
    expect(plan.keptNotes).toContain('Your own context7 tool connection in Codex.');
    expect(plan.keptNotes.join('\n')).toContain(`Your app at ${firstAppPath}.`);
    expect(plan.keptNotes.join('\n')).toContain('benchmark-backups');
    expect(plan.repairNotes).toEqual([]);

    const failures = yield* applyGlobalUninstall(plan, assistantCommands);
    expect(failures).toEqual([]);
    expect(claudeCalls).toContainEqual(['mcp', 'remove', '-s', 'user', 'vybekiit']);
    expect(claudeCalls).toContainEqual(['mcp', 'remove', '-s', 'user', 'context7']);
    expect(claudeCalls).not.toContainEqual(['mcp', 'remove', '-s', 'user', 'playwright']);
    expect(codexCalls).toContainEqual(['mcp', 'remove', 'vybekiit']);
    expect(codexCalls).toContainEqual(['mcp', 'remove', 'playwright']);
    expect(codexCalls).not.toContainEqual(['mcp', 'remove', 'context7']);

    yield* Effect.promise(async () => {
      expect(existsSync(join(paths.skillsDir, 'onboarding'))).toBe(false);
      expect(existsSync(join(paths.skillsDir, 'vybekiit-feedback'))).toBe(false);
      expect(await readFile(join(paths.skillsDir, 'my-skill', 'SKILL.md'), 'utf8')).toBe(
        'my own skill',
      );
      expect(existsSync(join(homeDirectory, '.agents', 'skills', 'onboarding'))).toBe(false);
      expect((await lstat(userSkillLink)).isSymbolicLink()).toBe(true);
      expect(await readFile(paths.memoryFile, 'utf8')).toBe('# My rules\nBe brief.\n');
      expect(existsSync(`${paths.memoryFile}.vybekiit-backup`)).toBe(false);
      expect(await readFile(join(settings.codexDirectory, 'AGENTS.md'), 'utf8')).toBe(
        'My codex rules.\n',
      );
      expect(existsSync(join(homeDirectory, '.gemini', 'GEMINI.md'))).toBe(false);
      expect(existsSync(join(paths.commandsDir, 'vybekiit.md'))).toBe(false);
      expect(JSON.parse(await readFile(paths.settingsFile, 'utf8'))).toEqual({
        theme: 'dark',
        statusLine: { type: 'command', command: 'node ~/statusline.mjs' },
      });
      expect(existsSync(join(guideDirectory, 'agent-guidance.md'))).toBe(false);
      expect(existsSync(join(guideDirectory, 'language.md'))).toBe(false);
      expect(existsSync(join(guideDirectory, 'agents.json'))).toBe(false);
      expect(existsSync(join(guideDirectory, 'feedback-consent.json'))).toBe(false);
      expect(await readFile(join(guideDirectory, 'benchmark-backups', 'keep.txt'), 'utf8')).toBe(
        'mine',
      );
      expect(existsSync(join(paths.configDir, '.vybekiit-install.json'))).toBe(false);
      expect(existsSync(join(firstAppPath, 'package.json'))).toBe(true);
    });

    const repeatedPlan = yield* planGlobalUninstall(settings, assistantCommands);
    expect(repeatedPlan.removals).toEqual([]);
  }),
);

it.scoped('leaves an instruction file with broken markers untouched and asks for a repair', () =>
  Effect.gen(function* () {
    const homeDirectory = yield* Effect.acquireRelease(
      Effect.promise(async () => {
        const scratchDirectory = join(process.cwd(), 'scripts', 'dev');
        await mkdir(scratchDirectory, { recursive: true });
        return mkdtemp(join(scratchDirectory, 'global-uninstall-'));
      }),
      (directory) => Effect.promise(() => rm(directory, { recursive: true, force: true })),
    );
    const settings = {
      homeDirectory,
      claudeDirectory: join(homeDirectory, '.claude'),
      codexDirectory: join(homeDirectory, '.codex'),
      executablePath: '',
      plainLanguageGuide: join(homeDirectory, 'bundled-language.md'),
    };
    const brokenInstruction =
      'Mine\n<!-- END VYBEKIIT -->\n<!-- BEGIN VYBEKIIT (managed by `vybekiit setup`) -->\n';
    yield* Effect.promise(async () => {
      await mkdir(settings.claudeDirectory, { recursive: true });
      await writeFile(join(settings.claudeDirectory, 'CLAUDE.md'), brokenInstruction);
    });
    const plan = yield* planGlobalUninstall(settings, {
      claude: missingCommand,
      codex: missingCommand,
    });
    expect(plan.removals).toEqual([]);
    expect(plan.repairNotes).toEqual([
      `Remove the VybeKiit section from ${join(settings.claudeDirectory, 'CLAUDE.md')} by hand, then run this again.`,
    ]);
    expect(plan.keptNotes).toContain(
      'Claude Code tool connections, because Claude Code is not installed.',
    );
    expect(
      yield* Effect.promise(() => readFile(join(settings.claudeDirectory, 'CLAUDE.md'), 'utf8')),
    ).toBe(brokenInstruction);
  }),
);

it.scoped('asks for a hand check when Codex cannot list its tool connections', () =>
  Effect.gen(function* () {
    const homeDirectory = yield* Effect.acquireRelease(
      Effect.promise(async () => {
        const scratchDirectory = join(process.cwd(), 'scripts', 'dev');
        await mkdir(scratchDirectory, { recursive: true });
        return mkdtemp(join(scratchDirectory, 'global-uninstall-'));
      }),
      (directory) => Effect.promise(() => rm(directory, { recursive: true, force: true })),
    );
    const settings = {
      homeDirectory,
      claudeDirectory: join(homeDirectory, '.claude'),
      codexDirectory: join(homeDirectory, '.codex'),
      executablePath: '',
      plainLanguageGuide: join(homeDirectory, 'bundled-language.md'),
    };
    const olderCodex: ExecFn = (codexArguments) =>
      Promise.resolve(
        codexArguments[0] === '--version'
          ? { code: 0, stdout: 'codex-cli 0.1.0', stderr: '' }
          : { code: 2, stdout: '', stderr: "unexpected argument '--json'" },
      );
    const plan = yield* planGlobalUninstall(settings, {
      claude: missingCommand,
      codex: olderCodex,
    });
    expect(plan.removals).toEqual([]);
    expect(plan.repairNotes.join('\n')).toContain('Codex could not list its tool connections.');
    expect(plan.repairNotes.join('\n')).toContain('codex mcp remove <name>');
  }),
);
