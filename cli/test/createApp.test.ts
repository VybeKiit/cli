import { describe, expect, it } from 'vitest';
import { parseCreateAppArgs } from '../src/commands/createApp';
import { formatCreateSuccess, isCreateSurface } from '../src/commands/scaffoldOutput';
import { formatSetupNextStep } from '../src/commands/setupNextStep';

describe('parseCreateAppArgs', () => {
  it('parses --web with default directory', () => {
    const parsed = parseCreateAppArgs(['--web']);
    expect(parsed).toEqual({
      ok: true,
      inputs: { surface: 'web', destPath: './web' },
    });
  });

  it('parses --mobile with explicit directory', () => {
    const parsed = parseCreateAppArgs(['--mobile', 'my-app']);
    expect(parsed).toEqual({
      ok: true,
      inputs: { surface: 'mobile', destPath: 'my-app' },
    });
  });

  it('parses --backend with default directory', () => {
    const parsed = parseCreateAppArgs(['--backend']);
    expect(parsed).toEqual({
      ok: true,
      inputs: { surface: 'backend', destPath: './backend' },
    });
  });

  it('rejects multiple surfaces', () => {
    const parsed = parseCreateAppArgs(['--web', '--mobile']);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toContain('Pick one surface');
    }
  });

  it('reports missing surface', () => {
    const parsed = parseCreateAppArgs([]);
    expect(parsed).toEqual({ ok: false, error: 'missing-surface' });
  });

  it('rejects unknown flags', () => {
    const parsed = parseCreateAppArgs(['--spa']);
    expect(parsed.ok).toBe(false);
  });
});

describe('isCreateSurface', () => {
  it('accepts buyer create surfaces, rejects non-create templates', () => {
    expect(isCreateSurface('web')).toBe(true);
    expect(isCreateSurface('backend')).toBe(true);
    expect(isCreateSurface('spa')).toBe(false);
  });
});

describe('formatCreateSuccess', () => {
  it('includes one next action', () => {
    const lines = formatCreateSuccess('web', './web');
    expect(lines.some((line) => line.includes('Set up my app'))).toBe(true);
    expect(lines.some((line) => line.includes('web'))).toBe(true);
  });
});

describe('formatSetupNextStep', () => {
  it('asks to re-run setup when doctor fails', () => {
    const lines = formatSetupNextStep({ doctorExitCode: 1, gateReason: 'ok' });
    expect(lines.join('\n')).toContain('vybekiit setup');
    expect(lines.join('\n')).not.toContain('create app');
  });

  it('asks for gh login when unauthenticated', () => {
    const lines = formatSetupNextStep({ doctorExitCode: 0, gateReason: 'gh-unauthed' });
    expect(lines.join('\n')).toContain('gh auth login --web');
  });

  it('points at create app when ready', () => {
    const lines = formatSetupNextStep({ doctorExitCode: 0, gateReason: 'ok' });
    expect(lines.join('\n')).toContain('vybekiit create app --web');
  });

  it('explains no access', () => {
    const lines = formatSetupNextStep({ doctorExitCode: 0, gateReason: 'no-access' });
    expect(lines.join('\n')).toContain('vybekiit.com');
  });
});
