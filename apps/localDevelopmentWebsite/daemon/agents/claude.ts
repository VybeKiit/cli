import { type ChildProcess, spawn } from 'node:child_process';
import type { AgentId } from '../protocol';

export type AgentProcess = {
  id: AgentId;
  sessionId: string;
  process: ChildProcess;
  onOutput: (chunk: string) => void;
  onExit: (code: number | null) => void;
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * @param onOutput - Called for each chunk of stdout/stderr from the agent
 * @param onExit - Called when the agent process exits
 * @returns AgentProcess handle for sending input and tracking the session
 * @example
 * const process = spawnClaude(onOutput, onExit);
 */
export const spawnClaude = (
  onOutput: (chunk: string) => void,
  onExit: (code: number | null) => void,
): AgentProcess => {
  const sessionId = uid();

  const proc = spawn('claude', ['--dangerously-skip-permissions'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, TERM: 'dumb' },
  });

  proc.stdout?.on('data', (data: Buffer) => onOutput(data.toString()));
  proc.stderr?.on('data', (data: Buffer) => onOutput(data.toString()));
  proc.on('exit', (code) => onExit(code));

  return { id: 'claude-code', sessionId, process: proc, onOutput, onExit };
};

/**
 * @param agent - The running agent process
 * @param content - Text to send to the agent's stdin
 * @returns Nothing; the content is written to the process stdin.
 * @example
 * sendToAgent(agent, 'continue');
 */
export const sendToAgent = (agent: AgentProcess, content: string) => {
  agent.process.stdin?.write(content + '\n');
};

/**
 * @param agent - The running agent process to stop
 * @returns Nothing; the process receives SIGTERM.
 * @example
 * stopAgent(agent);
 */
export const stopAgent = (agent: AgentProcess) => {
  agent.process.kill('SIGTERM');
};
