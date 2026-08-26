import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectTemplateName, runSyncAgentLayer } from '../src/commands/syncAgentLayer';

describe('detectTemplateName', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('detects mobile from expo dependency', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vyb-mobile-'));
    await writeFile(join(dir, 'package.json'), JSON.stringify({ dependencies: { expo: '1.0.0' } }));
    expect(await detectTemplateName(dir)).toBe('mobile');
  });

  it('detects web from next dependency', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vyb-web-'));
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({ dependencies: { next: '15.0.0' } }),
    );
    expect(await detectTemplateName(dir)).toBe('web');
  });
});

describe('runSyncAgentLayer', () => {
  it('copies allowlisted paths from mirror and reports plain summary', async () => {
    const buyer = await mkdtemp(join(tmpdir(), 'vyb-buyer-'));
    const mirror = await mkdtemp(join(tmpdir(), 'vyb-mirror-'));
    await mkdir(join(mirror, 'web', '.vybekiit'), { recursive: true });
    await mkdir(join(mirror, 'web', '.claude', 'hooks'), { recursive: true });
    await mkdir(join(buyer, '.claude', 'hooks'), { recursive: true });
    await writeFile(join(mirror, 'web', 'AGENTS.md'), '# agent');
    await writeFile(join(mirror, 'web', 'BUILDER-VOICE.md'), '# lang');
    await writeFile(join(mirror, 'web', '.claude', 'settings.json'), '{"hooks":"maintained"}');
    await writeFile(
      join(mirror, 'web', '.claude', 'hooks', 'block-visible-terminal-launch.sh'),
      '# maintained hook',
    );
    await writeFile(join(buyer, '.claude', 'settings.json'), '{"hooks":"stale"}');
    await writeFile(join(buyer, '.claude', 'hooks', 'buyer-hook.sh'), '# buyer hook');
    await writeFile(join(buyer, '.claude', 'settings.local.json'), '{"permissions":"personal"}');

    const copied: Array<{ src: string; dest: string }> = [];
    const result = await runSyncAgentLayer(['web'], buyer, {
      locateTemplateSource: async () => ({ source: mirror }),
      copy: async (src, dest) => {
        copied.push({ src: String(src), dest: String(dest) });
        const { cp } = await import('node:fs/promises');
        await cp(src, dest, { recursive: true, force: true });
      },
      runSkillsUpdate: () => Promise.resolve(),
      pathExists: async (path) => {
        try {
          const { access } = await import('node:fs/promises');
          await access(path);
          return true;
        } catch {
          return false;
        }
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.lines.some((l) => l.includes('Refreshing'))).toBe(true);
    expect(copied.some((c) => c.src.endsWith('AGENTS.md'))).toBe(true);
    expect(await readFile(join(buyer, '.claude', 'settings.json'), 'utf8')).toBe(
      '{"hooks":"maintained"}',
    );
    expect(
      await readFile(join(buyer, '.claude', 'hooks', 'block-visible-terminal-launch.sh'), 'utf8'),
    ).toBe('# maintained hook');
    expect(await readFile(join(buyer, '.claude', 'hooks', 'buyer-hook.sh'), 'utf8')).toBe(
      '# buyer hook',
    );
    expect(await readFile(join(buyer, '.claude', 'settings.local.json'), 'utf8')).toBe(
      '{"permissions":"personal"}',
    );
  });
});
