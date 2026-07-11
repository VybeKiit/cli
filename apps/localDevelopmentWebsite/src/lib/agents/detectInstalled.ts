import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { delimiter, isAbsolute, join } from 'node:path';
import { AGENT_IDS, AGENTS, type AgentDefinition, type AgentId } from './registry';

export type InstalledAgent = AgentDefinition & {
  readonly installed: boolean;
  readonly resolvedCommand: string | null;
};

/**
 * Resolve the first executable path for a command name on PATH (or absolute candidate).
 *
 * @param candidates - Binary names or absolute paths to try.
 * @returns Absolute path or bare command name if found, else null.
 * @example
 * const bin = await resolveExecutable(['claude']);
 */
export const resolveExecutable = async (candidates: readonly string[]): Promise<string | null> => {
  const pathEnv = process.env.PATH ?? '';
  const pathDirs = pathEnv.split(delimiter).filter((d) => d.length > 0);

  for (const candidate of candidates) {
    if (isAbsolute(candidate)) {
      try {
        await access(candidate, constants.X_OK);
        return candidate;
      } catch {
        continue;
      }
    }

    for (const dir of pathDirs) {
      const full = join(dir, candidate);
      try {
        await access(full, constants.X_OK);
        return full;
      } catch {
        // try next
      }
    }
  }

  return null;
};

/**
 * Detect which registered agent CLIs are installed on this machine.
 *
 * @returns Agent definitions with install status.
 * @example
 * const agents = await detectInstalledAgents();
 */
export const detectInstalledAgents = async (): Promise<InstalledAgent[]> => {
  const results: InstalledAgent[] = [];

  for (const id of AGENT_IDS) {
    const def = AGENTS[id];
    const resolved = await resolveExecutable(def.commandCandidates);
    results.push({
      ...def,
      installed: resolved !== null,
      resolvedCommand: resolved,
    });
  }

  return results;
};

/**
 * Resolve the shell-facing command name for launch scripts.
 *
 * @param agentId - Agent id.
 * @returns Preferred binary path/name for spawning, or the registry default.
 * @example
 * const cmd = await resolveAgentBinary('cursor');
 */
export const resolveAgentBinary = async (agentId: AgentId): Promise<string> => {
  const def = AGENTS[agentId];
  const resolved = await resolveExecutable(def.commandCandidates);
  return resolved ?? def.command;
};
