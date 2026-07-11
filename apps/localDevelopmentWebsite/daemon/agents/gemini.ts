import { spawn } from 'node:child_process';
import type { AgentId } from '../protocol';
import type { AgentProcess } from './claude';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * @param onOutput - Called for each chunk of stdout/stderr from the agent
 * @param onExit - Called when the agent process exits
 * @returns AgentProcess handle for the Gemini CLI session
 * @example
 * const process = spawnGemini(onOutput, onExit);
 */
export const spawnGemini = (
  onOutput: (chunk: string) => void,
  onExit: (code: number | null) => void,
): AgentProcess => {
  const sessionId = uid();

  const proc = spawn('gemini', [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, TERM: 'dumb' },
  });

  proc.stdout?.on('data', (data: Buffer) => onOutput(data.toString()));
  proc.stderr?.on('data', (data: Buffer) => onOutput(data.toString()));
  proc.on('exit', (code) => onExit(code));

  return { id: 'gemini', sessionId, process: proc, onOutput, onExit };
};
