import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import { resolveAgentBinary } from './detectInstalled';
import { type AgentId, buildNewSessionCommand, buildResumeCommand, shellQuote } from './registry';

export type LaunchMode = 'new' | 'resume';

export type LaunchRequest = {
  readonly agentId: AgentId;
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
 * Replace the first shell token with a resolved absolute binary when needed.
 *
 * @param command - Built CLI command.
 * @param binary - Resolved executable path.
 * @param defaultName - Default first token to replace.
 * @returns Command with binary path substituted.
 * @example
 * withResolvedBinary('claude --resume x', '/opt/claude', 'claude');
 */
const withResolvedBinary = (command: string, binary: string, defaultName: string): string => {
  if (binary === defaultName) {
    return command;
  }
  if (command.startsWith(`${defaultName} `) || command === defaultName) {
    return `${shellQuote(binary)}${command.slice(defaultName.length)}`;
  }
  // cursor agent / kiro-cli multi-word defaults
  if (defaultName.includes(' ')) {
    return command;
  }
  // kiro-cli chat ...
  if (command.startsWith('kiro-cli ') && binary !== 'kiro-cli') {
    return `${shellQuote(binary)}${command.slice('kiro-cli'.length)}`;
  }
  if (command.startsWith('cursor ') && binary !== 'cursor') {
    return `${shellQuote(binary)}${command.slice('cursor'.length)}`;
  }
  return command;
};

/**
 * Open a macOS Terminal (or iTerm) window running a command.
 *
 * @param fullCommand - Shell command including optional `cd`.
 * @returns Whether the open request was accepted.
 * @example
 * await openMacTerminal('cd ~/Code && claude');
 */
const openMacTerminal = async (fullCommand: string): Promise<boolean> => {
  const escaped = fullCommand.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

  // Prefer iTerm when present; fall back to Terminal.app.
  const script = `
    set cmd to "${escaped}"
    if application "iTerm" is running or application "iTerm2" is running then
      tell application "iTerm"
        activate
        try
          tell current window
            create tab with default profile
            tell current session to write text cmd
          end tell
        on error
          create window with default profile
          tell current window
            tell current session to write text cmd
          end tell
        end try
      end tell
    else
      tell application "Terminal"
        activate
        do script cmd
      end tell
    end if
  `;

  return new Promise((resolve) => {
    const child = spawn('osascript', ['-e', script], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
};

/**
 * Build the full shell line (cd + agent command) for a launch/resume request.
 *
 * @param request - Launch parameters.
 * @returns Absolute-friendly shell command string.
 * @example
 * const cmd = await buildLaunchShellCommand({ agentId: 'claude-code', mode: 'new' });
 */
export const buildLaunchShellCommand = async (
  request: LaunchRequest,
): Promise<{ command: string; cwd: string; displayCommand: string }> => {
  const cwd = request.cwd && request.cwd.length > 0 ? request.cwd : process.cwd();
  const binary = await resolveAgentBinary(request.agentId);

  let displayCommand: string;
  if (request.mode === 'resume') {
    const sessionId = request.sessionId;
    if (sessionId === undefined || sessionId.length === 0) {
      throw new Error('Resume requires a sessionId.');
    }
    displayCommand = buildResumeCommand(request.agentId, sessionId);
  } else {
    displayCommand = buildNewSessionCommand(request.agentId, request.prompt);
  }

  let defaultBin = request.agentId;
  if (request.agentId === 'kiro') {
    defaultBin = 'kiro-cli';
  } else if (request.agentId === 'claude-code') {
    defaultBin = 'claude';
  } else if (request.agentId === 'cursor') {
    defaultBin = 'cursor';
  }

  const resolvedCommand = withResolvedBinary(displayCommand, binary, defaultBin);
  const command = `cd ${shellQuote(cwd)} && ${resolvedCommand}`;

  return { command, cwd, displayCommand: resolvedCommand };
};

/**
 * Launch or resume an agent CLI in a real terminal window (macOS).
 * Always returns the command so the UI can copy it as a fallback.
 *
 * @param request - Launch parameters.
 * @returns Launch result with command + launched flag.
 * @example
 * const result = await launchAgentInTerminal({ agentId: 'codex', mode: 'new' });
 */
export const launchAgentInTerminal = async (request: LaunchRequest): Promise<LaunchResult> => {
  const { command, cwd, displayCommand } = await buildLaunchShellCommand(request);

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

  // Linux/Windows: copy-friendly command only (no reliable terminal open without deps).
  return {
    ok: true,
    command: displayCommand,
    cwd,
    launched: false,
    message: `Run this in your terminal (from ${cwd}): ${displayCommand}`,
  };
};
