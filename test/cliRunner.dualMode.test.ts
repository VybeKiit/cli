import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLI_HELP } from '../src/cliHelp';
import { COMMAND_NAMES, cliCommands, runCli } from '../src/cliRunner';
import * as tty from '../src/prompts/tty';

/**
 * Dual-mode contract (ADR-0036): non-TTY never hangs on prompts, and flat verbs
 * forward every positional after the top-level command (not just `rest`).
 */
describe('runCli dual-mode / argv forwarding', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('registers every verb once in cliCommands', () => {
    expect(COMMAND_NAMES.length).toBeGreaterThan(10);
    expect(COMMAND_NAMES).toEqual(Object.keys(cliCommands));
    expect(new Set(COMMAND_NAMES).size).toBe(COMMAND_NAMES.length);
  });

  it('prints buyer help and exits 0 on bare non-TTY invocation', async () => {
    vi.spyOn(tty, 'isInteractive').mockReturnValue(false);
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const code = await runCli([]);

    expect(code).toBe(0);
    expect(stdout.mock.calls.map((call) => String(call[0])).join('')).toContain(
      CLI_HELP.slice(0, 40),
    );
    expect(stderr).not.toHaveBeenCalled();
  });

  it('refuses env wizard in non-TTY without hanging', async () => {
    vi.stubEnv('VYBEKIIT_SKIP_GATE', '1');
    vi.spyOn(tty, 'isInteractive').mockReturnValue(false);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    const code = await runCli(['env', 'wizard']);

    expect(code).toBe(1);
    expect(stderr.mock.calls.map((call) => String(call[0])).join('')).toContain(
      'interactive terminal',
    );
  });

  it('refuses bare add in non-TTY without hanging', async () => {
    vi.stubEnv('VYBEKIIT_SKIP_GATE', '1');
    vi.spyOn(tty, 'isInteractive').mockReturnValue(false);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    const code = await runCli(['add']);

    expect(code).toBe(1);
    expect(stderr.mock.calls.map((call) => String(call[0])).join('')).toMatch(
      /non-interactive|list-pieces/i,
    );
  });

  it('forwards the first positional for plan-setup (not dropped as a noun-only slot)', async () => {
    vi.stubEnv('VYBEKIIT_SKIP_GATE', '1');
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const code = await runCli(['plan-setup', 'payments']);

    expect(code).toBe(0);
    const out = stdout.mock.calls.map((call) => String(call[0])).join('');
    // planSetup for payments must mention a concrete next step, not the usage error
    expect(out).not.toContain('Pass a setup domain');
    expect(out.length).toBeGreaterThan(20);
  });

  it('forwards feature + optional template for plan-readiness', async () => {
    vi.stubEnv('VYBEKIIT_SKIP_GATE', '1');
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const code = await runCli(['plan-readiness', 'payments', 'web']);

    expect(code).toBe(0);
    const payload = JSON.parse(
      stdout.mock.calls
        .map((call) => String(call[0]))
        .join('')
        .trim(),
    ) as { readonly ok?: boolean; readonly error?: string };
    expect(payload.error).toBeUndefined();
    expect(payload.ok).toBe(true);
  });

  it('forwards tech id for doc-fallback', async () => {
    vi.stubEnv('VYBEKIIT_SKIP_GATE', '1');
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const code = await runCli(['doc-fallback', 'supabase']);

    // found or not: must not be the usage error from a dropped arg
    const out = stdout.mock.calls.map((call) => String(call[0])).join('');
    expect(out).not.toContain('Usage: vybekiit doc-fallback');
    expect([0, 1]).toContain(code);
  });

  it('forwards flags for update-kit when they are the first token after the verb', async () => {
    vi.stubEnv('VYBEKIIT_SKIP_GATE', '1');
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    // Dry plan only — --check-agent-layer is a first token that must not be dropped
    const code = await runCli(['update-kit', '--check-agent-layer']);

    expect(code).toBe(0);
    const out = stdout.mock.calls.map((call) => String(call[0])).join('');
    expect(out).toContain('Update kit plan');
    expect(out).toContain('Run with --apply to sync the agent layer now.');
  });

  it('forwards directory for init as the first positional', async () => {
    vi.stubEnv('VYBEKIIT_SKIP_GATE', '1');
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    // Non-existent project dir fails package-manager detect — proves path was forwarded
    const code = await runCli(['init', '/tmp/vybekiit-cli-dual-mode-no-such-project']);

    expect(code).toBe(1);
    const err = stderr.mock.calls.map((call) => String(call[0])).join('');
    const out = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls
      .map((call: unknown[]) => String(call[0]))
      .join('');
    // Must attempt init (not silently use cwd as empty args would)
    expect(`${out}${err}`).toMatch(/package manager|Could not detect|init/i);
  });
});
