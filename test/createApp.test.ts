import { describe, expect, it } from 'vitest';
import { CLI_HELP, CLI_HELP_ALL } from '../src/cliHelp';
import { parseCreateAppArgs } from '../src/commands/createApp';
import {
  CREATE_SURFACE_PROMPT_OPTIONS,
  CREATE_SURFACES,
  isCreateSurface,
} from '../src/commands/createSurfaceRegistry';
import { formatCreateSuccess, formatCreateUsage } from '../src/commands/scaffoldOutput';
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
    expect(parsed).toEqual({
      ok: false,
      error: 'Pick one surface for now (--web, --mobile, --extension, or --backend).',
    });
  });

  it('reports missing surface', () => {
    const parsed = parseCreateAppArgs([]);
    expect(parsed).toEqual({ ok: false, error: 'missing-surface' });
  });

  it('rejects unknown flags', () => {
    const parsed = parseCreateAppArgs(['--spa']);
    expect(parsed).toEqual({
      ok: false,
      error: 'Unknown flag: --spa. Use --web, --mobile, --extension, or --backend.',
    });
  });
});

describe('isCreateSurface', () => {
  it('accepts buyer create surfaces, rejects non-create templates', () => {
    expect(isCreateSurface('web')).toBe(true);
    expect(isCreateSurface('backend')).toBe(true);
    expect(isCreateSurface('spa')).toBe(false);
  });
});

describe('create surface registry', () => {
  it('keeps every create-app surface in one buyer-facing order', () => {
    expect(CREATE_SURFACES.map((surface) => surface.id)).toEqual([
      'web',
      'mobile',
      'extension',
      'backend',
    ]);
  });

  it('preserves the interactive labels and hints', () => {
    expect(CREATE_SURFACE_PROMPT_OPTIONS).toEqual([
      { value: 'web', label: 'Web app', hint: 'Next.js + dashboard + marketing' },
      { value: 'mobile', label: 'Mobile app', hint: 'Expo' },
      { value: 'extension', label: 'Browser extension', hint: 'WXT' },
      { value: 'backend', label: 'Backend API', hint: 'Express + typed routes' },
    ]);
  });

  it('keeps usage and help output complete', () => {
    const buyerHelp = `${formatCreateUsage().join('\n')}\n${CLI_HELP}\n${CLI_HELP_ALL}`;

    for (const surface of CREATE_SURFACES) {
      expect(buyerHelp).toContain(`--${surface.id}`);
    }
  });

  it('preserves buyer-facing flag formatting', () => {
    expect(formatCreateUsage()).toEqual([
      'Pick one surface for your app:',
      '  vybekiit create app --web [directory]',
      '  vybekiit create app --mobile [directory]',
      '  vybekiit create app --extension [directory]',
      '  vybekiit create app --backend [directory]',
      '',
    ]);
    expect(CLI_HELP).toContain('  --web         Next.js + agent layer');
    expect(CLI_HELP).toContain('  --backend     Express API + typed routes');
    expect(CLI_HELP_ALL).toContain(
      'vybekiit create app --web|--mobile|--extension|--backend [directory]',
    );
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

  it('points at create app when ready and no first app yet', () => {
    const lines = formatSetupNextStep({ doctorExitCode: 0, gateReason: 'ok' });
    expect(lines.join('\n')).toContain('vybekiit create app --web');
  });

  it('points at the Session #1 app when first install already created one', () => {
    const lines = formatSetupNextStep({
      doctorExitCode: 0,
      gateReason: 'ok',
      firstAppPath: '/Users/me/vybekiit-app',
    });
    expect(lines.join('\n')).toContain('/Users/me/vybekiit-app');
    expect(lines.join('\n')).toContain('Set up my app');
    expect(lines.join('\n')).not.toContain('create app');
  });

  it('explains no access', () => {
    const lines = formatSetupNextStep({ doctorExitCode: 0, gateReason: 'no-access' });
    expect(lines.join('\n')).toContain('vybekiit.com');
  });
});
