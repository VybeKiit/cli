import { lstat, mkdir, readlink, rm, symlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  AGENT_SKILL_SYMLINKS,
  type AgentSkillSymlinkState,
  planAgentSkillSymlinks,
} from '@vybekiit/agent-kit';

/**
 * Check whether the agent skill compatibility links exist and point at the right target.
 *
 * @param cwd - Project directory containing agent skill folders.
 * @returns Map of configured symlink path to its observed state.
 * @example
 * const states = await readAgentSkillSymlinkStates(process.cwd());
 */
export const readAgentSkillSymlinkStates = async (
  cwd: string,
): Promise<Record<string, AgentSkillSymlinkState>> => {
  const states: Record<string, AgentSkillSymlinkState> = {};
  const entries = await Promise.all(
    AGENT_SKILL_SYMLINKS.map(async ({ link }) => {
      const linkPath = join(cwd, link);
      try {
        const stat = await lstat(linkPath);
        if (stat.isSymbolicLink()) {
          return [link, { isSymlink: true, target: await readlink(linkPath) }] as const;
        }

        return [link, { isSymlink: false, target: null }] as const;
      } catch {
        return null;
      }
    }),
  );

  for (const entry of entries) {
    if (entry !== null) {
      const [link, state] = entry;
      states[link] = state;
    }
  }

  return states;
};

/**
 * Check whether an error is the Node missing-path error.
 *
 * @param error - Unknown error caught from filesystem work.
 * @returns True when the error code is `ENOENT`.
 * @example
 * if (!isMissingPathError(error)) throw error;
 */
const isMissingPathError = (error: unknown): error is NodeJS.ErrnoException => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  if (!('code' in error)) {
    return false;
  }

  return error.code === 'ENOENT';
};

/**
 * Create `.claude/skills` and `.cursor/skills` symlinks to `.agents/skills`.
 *
 * @param cwd - Project directory containing agent skill folders.
 * @returns Symlink paths created or replaced by this call.
 * @example
 * const updated = await ensureAgentSkillSymlinks(process.cwd());
 */
export const ensureAgentSkillSymlinks = async (cwd: string): Promise<readonly string[]> => {
  const plan = planAgentSkillSymlinks(await readAgentSkillSymlinkStates(cwd));

  return Promise.all(
    plan.toCreate.map(async ({ link, target }) => {
      const linkPath = join(cwd, link);
      try {
        const stat = await lstat(linkPath);
        if (stat.isSymbolicLink()) {
          await rm(linkPath);
        } else if (stat.isDirectory()) {
          throw new Error(
            `${link} exists as a real directory. Remove it manually, then re-run render-agent-layer.`,
          );
        } else {
          await rm(linkPath);
        }
      } catch (error) {
        if (!isMissingPathError(error)) {
          throw error;
        }
      }

      await mkdir(dirname(linkPath), { recursive: true });
      await symlink(target, linkPath);
      return link;
    }),
  );
};
