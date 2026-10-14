import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecResult } from '../../src/global/exec';

const runProcess = vi.hoisted(() =>
  vi.fn(
    async (_command: string, _commandArguments: readonly string[], _spawnSettings?: object) => ({
      code: 0,
      stdout: '',
      stderr: '',
    }),
  ),
);

vi.mock('../../src/global/exec', () => ({ runProcess }));

const { claudeTerminalCommand, manualClaudeLine, openClaudeWithSeed } = await import(
  '../../src/global/claudeHandoff'
);

const exitWith = (code: number): ExecResult => ({ code, stdout: '', stderr: '' });

beforeEach(() => {
  runProcess.mockReset();
  runProcess.mockResolvedValue(exitWith(0));
});

describe('claudeTerminalCommand', () => {
  it('keeps the macOS Terminal tab open after Claude finishes', () => {
    const command = claudeTerminalCommand('/Users/me/vybekiit-app', 'Set up my app.');

    expect(command).toContain("cd '/Users/me/vybekiit-app'");
    expect(command).toContain("claude 'Set up my app.'");
    expect(command).toContain('exec "${SHELL:-/bin/zsh}" -l');
  });

  it('quotes a folder name with an apostrophe', () => {
    const command = claudeTerminalCommand("/Users/o'neil/app", 'Set up my app.');
    expect(command).toContain("cd '/Users/o'\\''neil/app'");
  });
});

describe('manualClaudeLine', () => {
  it('tells the buyer the one command to run', () => {
    expect(manualClaudeLine('Set up my app.')).toBe(
      'Open a terminal in that folder and run: claude "Set up my app."',
    );
  });
});

describe('openClaudeWithSeed', () => {
  it('opens a Terminal window on macOS', async () => {
    await expect(openClaudeWithSeed('/Users/me/app', 'Set up my app.', 'darwin')).resolves.toBe(
      true,
    );
    expect(runProcess).toHaveBeenCalledWith('osascript', expect.any(Array));
  });

  it('opens a new console window through PowerShell on Windows', async () => {
    await expect(openClaudeWithSeed('C:\\Users\\me\\app', 'Set up my app.', 'win32')).resolves.toBe(
      true,
    );
    const [, , powershellSettings] = runProcess.mock.calls[1] || [];
    expect(runProcess.mock.calls[1]?.[0]).toBe('powershell');
    expect(powershellSettings).toMatchObject({
      env: { VYBEKIIT_APP_PATH: 'C:\\Users\\me\\app', VYBEKIIT_CLAUDE_PROMPT: 'Set up my app.' },
    });
  });

  it('does not try to open a window on Linux', async () => {
    await expect(openClaudeWithSeed('/home/me/app', 'Set up my app.', 'linux')).resolves.toBe(
      false,
    );
    expect(runProcess).not.toHaveBeenCalled();
  });

  it('does not open a window when Claude Code is missing', async () => {
    runProcess.mockResolvedValueOnce(exitWith(127));
    await expect(openClaudeWithSeed('/Users/me/app', 'Set up my app.', 'darwin')).resolves.toBe(
      false,
    );
    expect(runProcess).toHaveBeenCalledTimes(1);
  });
});
