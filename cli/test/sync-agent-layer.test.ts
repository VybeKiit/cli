import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectTemplateName, runSyncAgentLayer } from '../src/sync-agent-layer';

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
    await writeFile(join(mirror, 'web', 'AGENTS.md'), '# agent');
    await writeFile(join(mirror, 'web', 'BUILDER-VOICE.md'), '# lang');

    const copied: Array<{ src: string; dest: string }> = [];
    const result = await runSyncAgentLayer(['web'], buyer, {
      resolve: async () => ({ source: mirror }),
      copy: async (src, dest) => {
        copied.push({ src: String(src), dest: String(dest) });
      },
      runSkillsUpdate: async () => {},
      pathExists: async () => true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.lines.some((l) => l.includes('Refreshing'))).toBe(true);
    expect(copied.some((c) => c.src.endsWith('AGENTS.md'))).toBe(true);
  });
});
