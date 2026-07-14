import { type ChildProcess, spawn } from 'node:child_process';
import { createStreamParser } from './claudeStream';
import type { Agent, TurnHandlers } from './types';

/** Spawn one turn's child process; injectable so tests can supply a fake. */
export type SpawnTurn = (args: readonly string[], cwd: string) => ChildProcess;

/** Flags shared by every turn — headless streaming, no interactive TTY. */
const BASE_ARGS = [
  '-p',
  '--output-format',
  'stream-json',
  '--include-partial-messages',
  '--verbose',
  '--dangerously-skip-permissions',
] as const;

/**
 * Spawn the real `claude` CLI for one turn.
 *
 * @param args - Full argv after the binary name.
 * @param cwd - Working directory the agent operates in.
 * @returns The child process.
 * @example
 * defaultSpawnTurn(['-p', 'hi'], process.cwd());
 */
const defaultSpawnTurn: SpawnTurn = (args, cwd) =>
  spawn('claude', [...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } });

/**
 * Create a Claude Code agent that runs each turn headlessly and streams
 * stream-json output back through handlers — no interactive terminal window.
 *
 * Session continuity: the first turn lets `claude` mint a session id (captured
 * from the init/result events); later turns pass `--resume <id>` so the agent
 * remembers the conversation.
 *
 * @param cwd - Working directory the agent operates in.
 * @param spawnTurn - Process spawner (defaults to the real `claude` CLI).
 * @returns An {@link Agent} handle.
 * @example
 * const agent = createClaudeAgent(process.cwd());
 * agent.send('add google sign-in', handlers);
 */
export const createClaudeAgent = (cwd: string, spawnTurn: SpawnTurn = defaultSpawnTurn): Agent => {
  let sessionId: string | null = null;
  let active: ChildProcess | null = null;

  const send = (prompt: string, handlers: TurnHandlers): void => {
    const resumeArgs = sessionId === null ? [] : ['--resume', sessionId];
    const child = spawnTurn([...BASE_ARGS, ...resumeArgs, prompt], cwd);
    active = child;

    const parser = createStreamParser();
    let sawText = false;
    let ended = false;

    const finish = (isError: boolean): void => {
      if (ended) {
        return;
      }
      ended = true;
      handlers.onEnd({ isError });
    };

    child.stdout?.on('data', (data: Buffer) => {
      for (const event of parser.push(data.toString())) {
        if (event.kind === 'session') {
          sessionId = event.sessionId;
          handlers.onSession?.(event.sessionId);
        } else if (event.kind === 'text') {
          sawText = true;
          handlers.onText(event.text);
        } else if (event.kind === 'tool') {
          handlers.onTool?.(event.name);
        } else {
          if (event.sessionId !== undefined) {
            sessionId = event.sessionId;
          }
          // Fallback: surface the final text when no streaming deltas arrived.
          if (!sawText && event.text !== undefined && event.text.length > 0) {
            handlers.onText(event.text);
          }
          finish(event.isError);
        }
      }
    });

    child.on('error', () => finish(true));
    child.on('exit', (code) => {
      if (active === child) {
        active = null;
      }
      // Guarantee the turn ends even if the process died before a `result`.
      finish(code !== 0 && code !== null);
    });
  };

  const stop = (): void => {
    active?.kill('SIGTERM');
    active = null;
  };

  return { id: 'claude-code', send, stop };
};
