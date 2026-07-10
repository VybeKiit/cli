import { mkdir, mkdtemp, readlink, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ensureAgentSkillSymlinks,
  readAgentSkillSymlinkStates,
} from '../src/lib/agentSkillSymlinks';

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

/**
 * Create a temp project with `.agents/skills` present.
 *
 * @returns Absolute path to the temp project root.
 */
const makeProject = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'vybekiit-skill-links-'));
  dirs.push(dir);
  await mkdir(join(dir, '.agents', 'skills'), { recursive: true });
  await writeFile(join(dir, '.agents', 'skills', '.keep'), '');
  return dir;
};

describe('ensureAgentSkillSymlinks', () => {
  it('creates .claude/skills and .cursor/skills links to .agents/skills', async () => {
    const cwd = await makeProject();
    const created = await ensureAgentSkillSymlinks(cwd);
    expect(created).toEqual(expect.arrayContaining(['.claude/skills', '.cursor/skills']));
    expect(await readlink(join(cwd, '.claude/skills'))).toBe('../.agents/skills');
    expect(await readlink(join(cwd, '.cursor/skills'))).toBe('../.agents/skills');
    const states = await readAgentSkillSymlinkStates(cwd);
    expect(states['.claude/skills']?.isSymlink).toBe(true);
    expect(states['.cursor/skills']?.target).toBe('../.agents/skills');
  });

  it('is a no-op when links already match', async () => {
    const cwd = await makeProject();
    await ensureAgentSkillSymlinks(cwd);
    const second = await ensureAgentSkillSymlinks(cwd);
    expect(second).toHaveLength(0);
  });
});
