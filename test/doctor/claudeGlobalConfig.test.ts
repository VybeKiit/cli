import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  formatGlobalStatus,
  isGloballyInstalled,
  listManagedSkillNames,
  readGlobalStatus,
} from '../../src/doctor/claudeGlobalConfig';
import { resolveGlobalPaths } from '../../src/global/globalPaths';

const makeConfig = async (): Promise<string> => mkdtemp(join(tmpdir(), 'vk-global-cfg-'));

const seedManagedSkill = async (skillsDir: string, name: string): Promise<void> => {
  await mkdir(join(skillsDir, name), { recursive: true });
  await writeFile(join(skillsDir, name, 'SKILL.md'), `# ${name}`, 'utf8');
  await writeFile(join(skillsDir, name, '.vybekiit-managed'), '', 'utf8');
};

describe('readGlobalStatus / isGloballyInstalled', () => {
  it('reports zero skills when nothing is installed', async () => {
    const paths = resolveGlobalPaths(await makeConfig());
    const status = await readGlobalStatus(paths);
    expect(status.skillCount).toBe(0);
    expect(status.hasCommand).toBe(false);
    expect(status.hasMemory).toBe(false);
    expect(isGloballyInstalled(status)).toBe(false);
  });

  it('counts only dirs with the managed marker', async () => {
    const paths = resolveGlobalPaths(await makeConfig());
    await seedManagedSkill(paths.skillsDir, 'onboarding');
    await seedManagedSkill(paths.skillsDir, 'go-live');
    await mkdir(join(paths.skillsDir, 'user-owned'), { recursive: true });
    await writeFile(join(paths.skillsDir, 'user-owned', 'SKILL.md'), 'mine', 'utf8');

    const status = await readGlobalStatus(paths);
    expect(status.skillCount).toBe(2);
    expect(await listManagedSkillNames(paths.skillsDir)).toEqual(['go-live', 'onboarding']);
  });

  it('is fully installed only when command + memory + skills are present', async () => {
    const paths = resolveGlobalPaths(await makeConfig());
    await seedManagedSkill(paths.skillsDir, 'onboarding');
    await mkdir(paths.commandsDir, { recursive: true });
    await writeFile(join(paths.commandsDir, 'vybekiit.md'), 'cmd', 'utf8');
    await writeFile(
      paths.memoryFile,
      '<!-- BEGIN VYBEKIIT (managed by `vybekiit setup`) -->\nok\n<!-- END VYBEKIIT -->\n',
      'utf8',
    );

    const status = await readGlobalStatus(paths);
    expect(isGloballyInstalled(status)).toBe(true);
  });
});

describe('formatGlobalStatus', () => {
  it('shows a hard setup nudge when managed skills are missing', () => {
    const line = formatGlobalStatus({
      hasCommand: false,
      hasMemory: false,
      skillCount: 0,
      skillSample: [],
    });
    expect(line).toContain('not set up');
    expect(line).toContain('global-install');
  });

  it('names a sample of skills when active', () => {
    const line = formatGlobalStatus({
      hasCommand: true,
      hasMemory: true,
      skillCount: 107,
      skillSample: ['add-signin', 'go-live', 'onboarding', 'plan-my-idea', 'setup-payments'],
    });
    expect(line).toContain('107 skills');
    expect(line).toContain('onboarding');
    expect(line).toContain('setup-payments');
  });
});
