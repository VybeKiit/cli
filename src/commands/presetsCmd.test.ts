import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runApplyPreset, runListPresets } from './presetsCmd';

describe('preset command review artifacts', () => {
  it('persists extension SQL and treats an identical repeated preview as a no-op', async () => {
    const project = await mkdtemp(join(tmpdir(), 'vybekiit-extension-'));
    const extension = {
      id: 'student-notes',
      version: 1,
      dependencies: [],
      requirements: [],
      indexes: [],
      capabilities: [],
      skills: [],
      packages: [],
      entities: [
        {
          name: 'student_notes',
          access: { mode: 'service-only' },
          checks: [],
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'student_id', type: 'text', required: true },
            { name: 'accessibility', type: 'text', required: true },
          ],
        },
      ],
    };
    await writeFile(join(project, 'extension.json'), JSON.stringify(extension));
    const flags = [
      'student-notes',
      '--provider',
      'railway',
      '--cwd',
      project,
      '--manifest',
      'extension.json',
      '--dry-run',
    ];
    const preview = await runApplyPreset(flags);
    expect(preview.exitCode).toBe(0);
    expect((await runApplyPreset(flags)).exitCode).toBe(0);
    const migration = await readFile(
      join(project, 'migrations/student-notes.1.railway.sql'),
      'utf8',
    );
    expect(migration).toContain('accessibility text not null');
    await writeFile(
      join(project, 'extension.json'),
      JSON.stringify({ ...extension, description: 'changed checksum' }),
    );
    expect((await runApplyPreset(flags)).exitCode).toBe(1);
    expect(await readFile(join(project, 'migrations/student-notes.1.railway.sql'), 'utf8')).toBe(
      migration,
    );
  });
  it('reports prerequisites and versions for discovery', () => {
    const catalog = JSON.parse(runListPresets().json);
    expect(catalog.presets.find((preset: { id: string }) => preset.id === 'booking')).toMatchObject(
      { version: 1, dependencies: ['organizations'] },
    );
  });
});
