import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ensureCodexSkillsEnabled, isCodexSkillsEnabled } from '../../src/doctor/codex-config';

describe('codex-config', () => {
  it('writes features.skills = true when config is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vybekiit-codex-'));
    const previous = process.env.CODEX_HOME;
    process.env.CODEX_HOME = dir;
    try {
      const result = await ensureCodexSkillsEnabled();
      expect(result.updated).toBe(true);
      const content = await readFile(result.path, 'utf8');
      expect(content).toContain('skills = true');
      expect(await isCodexSkillsEnabled()).toBe(true);
    } finally {
      process.env.CODEX_HOME = previous;
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('is idempotent when skills already enabled', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vybekiit-codex-'));
    const previous = process.env.CODEX_HOME;
    process.env.CODEX_HOME = dir;
    try {
      await ensureCodexSkillsEnabled();
      const second = await ensureCodexSkillsEnabled();
      expect(second.updated).toBe(false);
    } finally {
      process.env.CODEX_HOME = previous;
      await rm(dir, { recursive: true, force: true });
    }
  });
});
