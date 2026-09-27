import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { it } from '@effect/vitest';
import { Effect } from 'effect';
import { expect } from 'vitest';
import {
  agentInstallationTargets,
  installAgentGuidance,
  updateAgentInstruction,
} from './agentGuidance';

it('preserves user instructions byte-for-byte across reruns', () => {
  const personalGuidance = '# My preferences\r\nUse short sentences.\r\n';
  const installedGuidance = updateAgentInstruction(personalGuidance, 'Read the kit guidance.');
  expect(installedGuidance.startsWith(personalGuidance)).toBe(true);
  expect(updateAgentInstruction(installedGuidance, 'Read the kit guidance.')).toBe(
    installedGuidance,
  );
  expect(() => updateAgentInstruction('<!-- END VYBEKIIT -->', 'new')).toThrow();
  expect(() =>
    updateAgentInstruction(`${installedGuidance}<!-- END VYBEKIIT -->`, 'new'),
  ).toThrow();
});

it.scoped('shares skill files across agents and preserves a colliding user skill', () =>
  Effect.gen(function* () {
    const homeDirectory = yield* Effect.acquireRelease(
      Effect.promise(async () => {
        const scratchDirectory = join(process.cwd(), 'scripts', 'dev');
        await mkdir(scratchDirectory, { recursive: true });
        return mkdtemp(join(scratchDirectory, 'agent-guidance-'));
      }),
      (directory) => Effect.promise(() => rm(directory, { recursive: true, force: true })),
    );
    const settings = {
      homeDirectory,
      claudeDirectory: join(homeDirectory, '.claude'),
      codexDirectory: join(homeDirectory, '.codex'),
      executablePath: '',
    };
    const canonicalSkills = join(settings.claudeDirectory, 'skills');
    yield* Effect.promise(async () => {
      await mkdir(join(canonicalSkills, 'onboarding'), { recursive: true });
      await writeFile(join(canonicalSkills, 'onboarding', 'SKILL.md'), 'kit onboarding');
      await mkdir(settings.codexDirectory, { recursive: true });
      await writeFile(join(settings.codexDirectory, 'AGENTS.md'), 'My own preferences.\n');
      await writeFile(
        join(settings.codexDirectory, 'AGENTS.override.md'),
        'My active preferences.\n',
      );
      await mkdir(join(homeDirectory, '.kiro', 'skills', 'onboarding'), { recursive: true });
      await writeFile(
        join(homeDirectory, '.kiro', 'skills', 'onboarding', 'SKILL.md'),
        'my onboarding',
      );
    });
    const agents = agentInstallationTargets(settings);
    const installations = yield* installAgentGuidance(
      settings,
      agents,
      canonicalSkills,
      ['onboarding'],
      '0.7.26',
    );
    expect(installations.find((agent) => agent.agent === 'codex')?.status).toBe('restart-required');
    expect(installations.find((agent) => agent.agent === 'kiro')?.collisions).toEqual([
      'onboarding',
    ]);
    expect(installations.find((agent) => agent.agent === 'gemini')?.status).toBe('not-detected');
    yield* installAgentGuidance(settings, agents, canonicalSkills, ['onboarding'], '0.7.26');
    yield* Effect.promise(async () => {
      expect(await readFile(join(settings.claudeDirectory, 'CLAUDE.md'), 'utf8')).toContain(
        '@~/.vybekiit/agent-guidance.md',
      );
      expect(await realpath(join(homeDirectory, '.agents', 'skills', 'onboarding'))).toBe(
        await realpath(join(canonicalSkills, 'onboarding')),
      );
      expect(
        await readFile(join(homeDirectory, '.kiro', 'skills', 'onboarding', 'SKILL.md'), 'utf8'),
      ).toBe('my onboarding');
      const codexInstruction = await readFile(
        join(settings.codexDirectory, 'AGENTS.override.md'),
        'utf8',
      );
      expect(codexInstruction.startsWith('My active preferences.\n')).toBe(true);
      expect(codexInstruction.match(/BEGIN VYBEKIIT/g)).toHaveLength(1);
      expect(await readFile(join(settings.codexDirectory, 'AGENTS.md'), 'utf8')).toBe(
        'My own preferences.\n',
      );
      expect(
        await readFile(join(settings.codexDirectory, 'AGENTS.override.md.vybekiit-backup'), 'utf8'),
      ).toBe('My active preferences.\n');
    });
  }),
);
