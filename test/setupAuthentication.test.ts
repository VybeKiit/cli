import { describe, expect, it, vi } from 'vitest';
import { connectSetupServices } from '../src/commands/setupAuthentication';
import type { SetupPreferences } from '../src/commands/setupPreferences';
import type { ExecResult } from '../src/global/exec';

const SELECTED_STACK: SetupPreferences = {
  data: 'supabase',
  googleSignIn: false,
  hosting: 'cloudflare',
};

const exitWith = (code: number, stdout = ''): ExecResult => ({ code, stdout, stderr: '' });

const browserAvailable = () => true;

describe('connectSetupServices', () => {
  it('reuses existing sign-ins and does not open another browser flow', async () => {
    const run = vi.fn(async () => exitWith(0));
    const connection = await connectSetupServices(SELECTED_STACK, false, run, browserAvailable);

    expect(connection.ok).toBe(true);
    expect(connection.connected).toEqual(['gh', 'wrangler', 'supabase']);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('leaves GitHub out for a buyer who unzipped the kit', async () => {
    const run = vi.fn(async () => exitWith(0));
    const connection = await connectSetupServices(SELECTED_STACK, true, run, browserAvailable);

    expect(connection.connected).toEqual(['wrangler', 'supabase']);
    expect(run).not.toHaveBeenCalledWith('gh', expect.anything(), expect.anything());
  });

  it('runs the official browser sign-in and verifies it afterward', async () => {
    const attempts = new Map<string, number>();
    const run = vi.fn(async (command: string, args: readonly string[], interactive: boolean) => {
      const key = `${command} ${args.join(' ')}`;
      const attempt = attempts.get(key) || 0;
      attempts.set(key, attempt + 1);

      if (command === 'wrangler' && args[0] === 'whoami') {
        return exitWith(attempt === 0 ? 1 : 0);
      }
      if (command === 'wrangler' && args[0] === 'login') {
        expect(interactive).toBe(true);
      }
      return exitWith(0);
    });

    const connection = await connectSetupServices(SELECTED_STACK, false, run, browserAvailable);

    expect(connection.ok).toBe(true);
    expect(run).toHaveBeenCalledWith('wrangler', ['login'], true);
    expect(run).toHaveBeenCalledWith('wrangler', ['whoami'], false);
  });

  it('treats a signed-out wrangler whoami that exits 0 as signed out', async () => {
    const run = vi.fn(async (command: string) =>
      command === 'wrangler'
        ? exitWith(0, 'You are not authenticated. Please run `wrangler login`.')
        : exitWith(0),
    );

    const connection = await connectSetupServices(SELECTED_STACK, false, run, () => false);

    expect(connection.needsAttention).toEqual(['wrangler']);
  });

  it('signs in to GitHub over HTTPS without an SSH key', async () => {
    const run = vi.fn(async (command: string, args: readonly string[]) =>
      command === 'gh' && args[1] === 'status' ? exitWith(1) : exitWith(0),
    );

    await connectSetupServices(SELECTED_STACK, false, run, browserAvailable);

    expect(run).toHaveBeenCalledWith(
      'gh',
      ['auth', 'login', '--web', '-h', 'github.com', '-p', 'https', '--skip-ssh-key'],
      true,
    );
  });

  it('skips browser sign-ins when no browser can open and prints the command', async () => {
    const run = vi.fn(async (_command: string, _args: readonly string[], _interactive: boolean) =>
      exitWith(1),
    );

    const connection = await connectSetupServices(SELECTED_STACK, false, run, () => false);

    expect(run).toHaveBeenCalledTimes(3);
    expect(run.mock.calls.every(([, , interactive]) => interactive === false)).toBe(true);
    expect(connection.lines.join('\n')).toContain('gh auth login --web');
  });

  it('fails honestly when sign-in still cannot be verified', async () => {
    const run = vi.fn(async (command: string) => exitWith(command === 'supabase' ? 1 : 0));
    const connection = await connectSetupServices(SELECTED_STACK, false, run, browserAvailable);

    expect(connection.ok).toBe(false);
    expect(connection.needsAttention).toEqual(['supabase']);
    expect(connection.lines.join('\n')).toContain('supabase login');
  });
});
