import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { platform, tmpdir } from 'node:os';
import { join } from 'node:path';
import type { VybeAssistant } from '@vybekiit/report-mode';

export type LaunchMode = 'new' | 'resume';

export type LaunchRequest = {
  readonly assistant: VybeAssistant;
  readonly mode: LaunchMode;
  readonly sessionId?: string | undefined;
  readonly prompt?: string | undefined;
  readonly cwd?: string | undefined;
};

export type LaunchResult = {
  readonly ok: boolean;
  readonly command: string;
  readonly cwd: string;
  readonly launched: boolean;
  readonly message: string;
};

/**
 * Quote a string for POSIX shell single-quote safety.
 *
 * @param value - Raw string.
 * @returns Single-quoted shell fragment.
 * @example
 * shellQuote(`it's`); // `'it'\\''s'`
 */
export const shellQuote = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

/**
 * Build a shell command that starts a new agent session.
 *
 * @param assistant - Target assistant.
 * @param titleOrPrompt - Optional first prompt.
 * @returns Shell command string (no `cd`).
 * @example
 * buildNewSessionCommand('claude', 'ship auth');
 */
export const buildNewSessionCommand = (
  assistant: VybeAssistant,
  titleOrPrompt?: string,
): string => {
  const prompt = titleOrPrompt?.trim() ?? '';
  const quoted = prompt.length > 0 ? shellQuote(prompt) : '';

  switch (assistant) {
    case 'kiro':
      return prompt.length > 0 ? `kiro-cli chat ${quoted}` : 'kiro-cli chat';
    case 'claude':
      return prompt.length > 0 ? `claude ${quoted}` : 'claude';
    case 'cursor':
      return prompt.length > 0 ? `cursor agent ${quoted}` : 'cursor agent';
    case 'codex':
      return prompt.length > 0 ? `codex ${quoted}` : 'codex';
    case 'kimi':
      // Interactive TUI only — `--prompt` is non-interactive print mode.
      return 'kimi';
    case 'grok':
      return prompt.length > 0 ? `grok ${quoted}` : 'grok';
    case 'devin':
      return prompt.length > 0 ? `devin -- ${quoted}` : 'devin';
  }
};

/**
 * Build a shell command that resumes an existing agent session.
 *
 * @param assistant - Target assistant.
 * @param sessionId - Session id known to that agent.
 * @returns Shell command string (no `cd`).
 * @example
 * buildResumeCommand('claude', 'abc-123');
 */
export const buildResumeCommand = (assistant: VybeAssistant, sessionId: string): string => {
  const id = shellQuote(sessionId);

  switch (assistant) {
    case 'kiro':
      return `kiro-cli chat --resume-id ${id}`;
    case 'claude':
      return `claude --resume ${id}`;
    case 'cursor':
      return `cursor agent --resume ${id}`;
    case 'codex':
      return `codex resume ${id}`;
    case 'kimi':
      return `kimi --session ${id}`;
    case 'grok':
      return `grok --resume ${id}`;
    case 'devin':
      return `devin --resume ${id}`;
  }
};

/**
 * Run a process and resolve true only when it exits with code 0.
 *
 * @param command - Executable.
 * @param args - Argv.
 * @returns Whether the process exited successfully.
 */
const spawnExitOk = (command: string, args: readonly string[]): Promise<boolean> =>
  new Promise((resolve) => {
    const child = spawn(command, [...args], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });

/**
 * Open Terminal by writing a temporary `.command` file and `open`ing it.
 * Does not need Apple Events / Automation permission (more reliable from Node servers).
 *
 * @param fullCommand - Shell command including optional `cd`.
 * @returns Whether the open request was accepted.
 */
const openMacTerminalViaCommandFile = async (fullCommand: string): Promise<boolean> => {
  const stamp = randomBytes(6).toString('hex');
  const path = join(tmpdir(), `vybe-agent-${stamp}.command`);
  // Keep the shell open after the agent exits so the vibe coder can see output.
  const body = `#!/bin/bash\n${fullCommand}\nexec "$SHELL" -l\n`;
  try {
    await writeFile(path, body, { mode: 0o755 });
  } catch {
    return false;
  }
  const opened = await spawnExitOk('open', [path]);
  // Best-effort cleanup after Terminal has a chance to read the file.
  // unref so a short-lived Node process (tests/scripts) is not held open.
  const timer = setTimeout(() => {
    void unlink(path).catch(() => undefined);
  }, 15_000);
  timer.unref();
  return opened;
};

/**
 * Open Terminal via a minimal AppleScript `do script` (no iTerm branch — that path
 * regularly fails with syntax/TCC errors from headless Node).
 *
 * @param fullCommand - Shell command including optional `cd`.
 * @returns Whether the open request was accepted.
 */
const openMacTerminalViaOsascript = async (fullCommand: string): Promise<boolean> => {
  // Escape for AppleScript double-quoted string: backslash then double-quote.
  const escaped = fullCommand.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  const script = `tell application "Terminal" to do script "${escaped}"`;
  return spawnExitOk('osascript', ['-e', script]);
};

/**
 * Open a macOS Terminal window running a command.
 * Prefers a `.command` file (no Automation permission), then AppleScript fallback.
 *
 * @param fullCommand - Shell command including optional `cd`.
 * @returns Whether the open request was accepted.
 * @example
 * await openMacTerminal('cd ~/Code && claude');
 */
const openMacTerminal = async (fullCommand: string): Promise<boolean> => {
  if (await openMacTerminalViaCommandFile(fullCommand)) {
    return true;
  }
  return openMacTerminalViaOsascript(fullCommand);
};

/**
 * Launch or resume an agent CLI in a real terminal window (macOS).
 * Always returns the command so the UI can copy it as a fallback.
 *
 * @param request - Launch parameters.
 * @returns Launch result with command + launched flag.
 * @example
 * const result = await launchAgentInTerminal({ assistant: 'codex', mode: 'new' });
 */
export const launchAgentInTerminal = async (request: LaunchRequest): Promise<LaunchResult> => {
  const cwd = request.cwd && request.cwd.length > 0 ? request.cwd : process.cwd();

  let displayCommand: string;
  if (request.mode === 'resume') {
    const sessionId = request.sessionId;
    if (sessionId === undefined || sessionId.length === 0) {
      return {
        ok: false,
        command: '',
        cwd,
        launched: false,
        message: 'Resume requires a sessionId.',
      };
    }
    displayCommand = buildResumeCommand(request.assistant, sessionId);
  } else {
    displayCommand = buildNewSessionCommand(request.assistant, request.prompt);
  }

  const command = `cd ${shellQuote(cwd)} && ${displayCommand}`;

  if (platform() === 'darwin') {
    const launched = await openMacTerminal(command);
    if (launched) {
      return {
        ok: true,
        command: displayCommand,
        cwd,
        launched: true,
        message:
          request.mode === 'resume'
            ? 'Opened a terminal and resumed the session.'
            : 'Opened a terminal with a new agent session.',
      };
    }
    return {
      ok: true,
      command: displayCommand,
      cwd,
      launched: false,
      message: 'Could not open Terminal automatically. Copy the command and run it yourself.',
    };
  }

  return {
    ok: true,
    command: displayCommand,
    cwd,
    launched: false,
    message: `Run this in your terminal (from ${cwd}): ${displayCommand}`,
  };
};
