import { lstat, mkdir, readlink, rm, symlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  AGENT_SKILL_SYMLINKS,
  planAgentSkillSymlinks,
  type AgentSkillSymlinkState,
} from '@vybekiit/agent-kit';

export async function readAgentSkillSymlinkStates(
  cwd: string,
): Promise<Record<string, AgentSkillSymlinkState>> {
  const states: Record<string, AgentSkillSymlinkState> = {};
  for (const { link } of AGENT_SKILL_SYMLINKS) {
    const linkPath = join(cwd, link);
    try {
      const stat = await lstat(linkPath);
      if (stat.isSymbolicLink()) {
        states[link] = { isSymlink: true, target: await readlink(linkPath) };
      } else {
        states[link] = { isSymlink: false, target: null };
      }
    } catch {
      // missing — omit key so check reports missing
    }
  }
  return states;
}

/** Create `.claude/skills` and `.cursor/skills` symlinks → `.agents/skills`. */
export async function ensureAgentSkillSymlinks(cwd: string): Promise<readonly string[]> {
  const plan = planAgentSkillSymlinks(await readAgentSkillSymlinkStates(cwd));
  const updated: string[] = [];

  for (const { link, target } of plan.toCreate) {
    const linkPath = join(cwd, link);
    try {
      const stat = await lstat(linkPath);
      if (stat.isSymbolicLink()) {
        await rm(linkPath);
      } else if (stat.isDirectory()) {
        throw new Error(
          `${link} exists as a real directory — remove it manually, then re-run render-agent-layer`,
        );
      } else {
        await rm(linkPath);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    await mkdir(dirname(linkPath), { recursive: true });
    await symlink(target, linkPath);
    updated.push(link);
  }

  return updated;
}
