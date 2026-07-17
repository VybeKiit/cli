import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveGlobalPaths } from '../../src/global/globalPaths';
import { installGlobalSkills } from '../../src/global/installGlobalSkills';

/** Build a throwaway bundled-skills source dir with two skills + a manifest. */
const makeSource = async (): Promise<string> => {
  const source = await mkdtemp(join(tmpdir(), 'vk-skills-src-'));
  for (const name of ['onboarding', 'go-live']) {
    await mkdir(join(source, name), { recursive: true });
    await writeFile(join(source, name, 'SKILL.md'), `# ${name}`, 'utf8');
  }
  await writeFile(
    join(source, 'manifest.json'),
    JSON.stringify({ skills: ['onboarding', 'go-live'], count: 2 }),
    'utf8',
  );
  return source;
};

const makeConfig = async (): Promise<string> => mkdtemp(join(tmpdir(), 'vk-cfg-'));

describe('installGlobalSkills', () => {
  it('copies the bundled skills into the skills dir', async () => {
    const paths = resolveGlobalPaths(await makeConfig());
    const result = await installGlobalSkills(paths, await makeSource());
    expect(result.installed).toEqual(['onboarding', 'go-live']);
    expect(await readFile(join(paths.skillsDir, 'onboarding', 'SKILL.md'), 'utf8')).toBe(
      '# onboarding',
    );
  });

  it('never clobbers a same-named skill the user authored', async () => {
    const paths = resolveGlobalPaths(await makeConfig());
    await mkdir(join(paths.skillsDir, 'onboarding'), { recursive: true });
    await writeFile(join(paths.skillsDir, 'onboarding', 'SKILL.md'), 'MINE', 'utf8');

    const result = await installGlobalSkills(paths, await makeSource());
    expect(result.skipped).toContain('onboarding');
    expect(await readFile(join(paths.skillsDir, 'onboarding', 'SKILL.md'), 'utf8')).toBe('MINE');
  });

  it('is idempotent — refreshes managed skills without duplicating them', async () => {
    const source = await makeSource();
    const paths = resolveGlobalPaths(await makeConfig());
    await installGlobalSkills(paths, source);
    const second = await installGlobalSkills(paths, source);
    expect(second.installed).toEqual(['onboarding', 'go-live']);
    expect(second.skipped).toEqual([]);
  });
});
