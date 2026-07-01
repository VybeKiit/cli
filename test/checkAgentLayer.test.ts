import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCheckAgentLayer } from '../src/commands/check-agent-layer';

describe('runCheckAgentLayer', () => {
  it('returns exit 1 when checklist structure missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vyb-compliance-'));
    await mkdir(join(dir, '.vybekiit/agent'), { recursive: true });
    await mkdir(join(dir, '.vybekiit/skills'), { recursive: true });
    await writeFile(join(dir, 'package.json'), JSON.stringify({ dependencies: { next: '15' } }));
    await writeFile(join(dir, 'CONTEXT.md'), '# CONTEXT.md\n');
    await writeFile(
      join(dir, '.vybekiit/agent/tech-references.md'),
      '<!-- vybekiit:generated:start tech-references --><!-- vybekiit:generated:end tech-references -->',
    );
    await writeFile(
      join(dir, '.vybekiit/agent/session-bootstrap.md'),
      '<!-- vybekiit:generated:start session-bootstrap --><!-- vybekiit:generated:end session-bootstrap -->',
    );
    await writeFile(join(dir, 'checklist.md'), '# Production checklist\n');

    const result = await runCheckAgentLayer(['web'], dir);
    expect(result.exitCode).toBe(1);
    const parsed = JSON.parse(result.json) as { ok: boolean };
    expect(parsed.ok).toBe(false);
  });
});
