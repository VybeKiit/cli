import { describe, expect, it } from 'vitest';
import { verifyProjectHealth } from '../../src/doctor/projectHealth';

describe('project health verification', () => {
  it('passes for web template with .cursorignore and .gitignore', () => {
    const report = verifyProjectHealth(new URL('../../../templates/web', import.meta.url).pathname);

    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.startsWith('✓'))).toBe(true);
  });
});
