import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const agnixBin = join(REPO_ROOT, 'node_modules/.bin/agnix');

describe('lint-agent-configs', () => {
  it('has agnix config scoped to VybeKiit-owned agent wiring', async () => {
    await access(join(REPO_ROOT, '.agnix.toml'));
  });

  it('agnix reports zero errors on the maintainer monorepo', () => {
    const result = spawnSync(agnixBin, ['.'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
  });
});
