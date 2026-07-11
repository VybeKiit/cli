import { spawnSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AgentId, DetectedAgent } from '../lib/agentDetection';
import { getAgentById, listAgents } from '../lib/agentDetection';
import { ensureAgentSkillSymlinks } from '../lib/agentSkillSymlinks';
import { writeFirstPartyMcpConfigFile } from '../lib/firstPartyMcp';
import {
  createDefaultMcpWireDeps,
  type McpWireDeps,
  readCoreMcpServerNames,
  wireCoreMcps,
} from './mcpWire';

/** Report produced by the agent skills + MCP doctor step. */
export type AgentExperienceReport = {
  readonly ok: boolean;
  readonly lines: readonly string[];
  readonly agents: readonly DetectedAgent[];
};

/** Injectable probes for agent experience (tests). */
export type AgentExperienceDeps = {
  readonly commandExists: (command: string) => boolean;
  readonly pathExists: (path: string) => boolean;
  readonly env: NodeJS.ProcessEnv;
  readonly ensureProjectSkillLinks: (cwd: string) => Promise<void>;
  /** Optional MCP wire I/O overrides (tests). */
  readonly mcp?: Partial<McpWireDeps>;
};

/**
 * Probe whether a command is on PATH.
 *
 * @param command - Executable name.
 * @returns True when `command --version` (or `--help`) can spawn.
 * @example
 * const present = defaultCommandExists('claude');
 */
const defaultCommandExists = (command: string): boolean => {
  const version = spawnSync(command, ['--version'], { stdio: 'ignore' });
  if (version.status === 0) {
    return true;
  }
  const help = spawnSync(command, ['--help'], { stdio: 'ignore' });
  return help.status === 0 || help.error === undefined;
};

/**
 * Probe whether a filesystem path exists.
 *
 * @param path - Absolute path.
 * @returns True when the path is accessible.
 * @example
 * const ok = defaultPathExists('/tmp');
 */
const defaultPathExists = (path: string): boolean => {
  try {
    accessSync(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

/**
 * Build default agent-experience deps bound to the real environment.
 *
 * @returns Deps used by doctor in production.
 * @example
 * const deps = createDefaultAgentExperienceDeps();
 */
export const createDefaultAgentExperienceDeps = (): AgentExperienceDeps => ({
  commandExists: defaultCommandExists,
  pathExists: defaultPathExists,
  env: process.env,
  ensureProjectSkillLinks: async (cwd) => {
    await ensureAgentSkillSymlinks(cwd);
  },
});

/**
 * Detect agents present globally (CLI / home / env) or in the project.
 *
 * @param cwd - Project directory (may be empty for pre-create doctor).
 * @param deps - Injectable probes.
 * @returns Unique detected agents; always includes primary session agent when none found.
 * @example
 * const agents = detectPresentAgents(process.cwd(), createDefaultAgentExperienceDeps());
 */
export const detectPresentAgents = (
  cwd: string,
  deps: AgentExperienceDeps = createDefaultAgentExperienceDeps(),
): DetectedAgent[] => {
  const found = new Map<AgentId, DetectedAgent>();
  const add = (id: AgentId): void => {
    found.set(id, getAgentById(id));
  };

  const { env } = deps;
  if (env.CLAUDE_CODE === '1' || env.ANTHROPIC_CLI === '1') {
    add('claude-code');
  }
  if (
    env.CURSOR_AGENT === '1' ||
    env.CURSOR === '1' ||
    env.CURSOR_TRACE_ID !== undefined ||
    env.CURSOR_SESSION_ID !== undefined
  ) {
    add('cursor');
  }
  if (env.GEMINI_CLI === '1' || env.GOOGLE_CLI === '1') {
    add('gemini');
  }
  if (env.CODEX_CLI === '1' || env.OPENAI_CODEX === '1') {
    add('codex');
  }

  if (deps.commandExists('claude')) {
    add('claude-code');
  }
  if (deps.commandExists('codex')) {
    add('codex');
  }
  if (deps.commandExists('gemini')) {
    add('gemini');
  }

  const home = homedir();
  if (deps.pathExists(join(home, '.claude'))) {
    add('claude-code');
  }
  if (deps.pathExists(join(home, '.codex'))) {
    add('codex');
  }
  if (deps.pathExists(join(home, '.cursor'))) {
    add('cursor');
  }

  if (deps.pathExists(join(cwd, '.claude'))) {
    add('claude-code');
  }
  if (deps.pathExists(join(cwd, '.cursor'))) {
    add('cursor');
  }
  if (deps.pathExists(join(cwd, 'AGENTS.md'))) {
    add('codex');
  }

  if (found.size === 0) {
    // Prefer Cursor when session markers exist without command; else default Claude Code.
    if (env.CURSOR_TRACE_ID !== undefined || env.CURSOR_SESSION_ID !== undefined) {
      return [getAgentById('cursor')];
    }
    return [getAgentById('claude-code')];
  }

  // Stable order matching listAgents registry.
  return listAgents().filter((agent) => found.has(agent.id));
};

/**
 * Build MCP wire deps from agent-experience deps (shared path/command probes).
 *
 * @param deps - Agent experience deps.
 * @returns Full MCP wire deps for {@link wireCoreMcps}.
 * @example
 * const mcpDeps = resolveMcpWireDeps(createDefaultAgentExperienceDeps());
 */
const resolveMcpWireDeps = (deps: AgentExperienceDeps): McpWireDeps => {
  const defaults = createDefaultMcpWireDeps();
  return {
    ...defaults,
    pathExists: deps.pathExists,
    commandExists: deps.commandExists,
    ...deps.mcp,
  };
};

/**
 * Run agent detection, project skill link ensure, and MCP readiness / wire lines.
 *
 * When the project has a kit MCP catalog, wires curated **core** assistant tools
 * into project-scoped configs for MCP-capable agents (Cursor / Claude Code).
 * Pre-create (no catalog) stays report-only.
 *
 * @param cwd - Project directory.
 * @param options - Whether the skills CLI is installed.
 * @param deps - Injectable probes.
 * @returns Lines and overall ok flag for doctor output.
 * @example
 * const report = await runAgentExperience(process.cwd(), { skillsCliReady: true });
 */
export const runAgentExperience = async (
  cwd: string,
  options: { readonly skillsCliReady: boolean },
  deps: AgentExperienceDeps = createDefaultAgentExperienceDeps(),
): Promise<AgentExperienceReport> => {
  const agents = detectPresentAgents(cwd, deps);
  const lines: string[] = [];
  let ok = true;
  const names = agents.map((agent) => agent.name).join(', ');
  lines.push(`✓ agents detected - ${names}`);

  const hasProjectSkills =
    deps.pathExists(join(cwd, '.agents', 'skills')) ||
    deps.pathExists(join(cwd, 'platform-skills.manifest.json')) ||
    deps.pathExists(join(cwd, 'skills-lock.json'));

  if (hasProjectSkills) {
    try {
      await deps.ensureProjectSkillLinks(cwd);
      lines.push('✓ project skills - discovery links ready for Claude Code and Cursor.');
    } catch {
      lines.push(
        '→ project skills - could not refresh discovery links. Re-run doctor after your project files are in place.',
      );
    }
  } else {
    lines.push(
      '→ project skills - no project skill pack yet (normal before create app). Global agent CLIs still work.',
    );
  }

  if (options.skillsCliReady) {
    lines.push('✓ skills CLI - ready to pin official platform skills when the project has a lock.');
  } else {
    lines.push(
      '→ skills CLI - not installed yet. Doctor installs it with the agent toolchain; re-run if missing.',
    );
  }

  const mcpCapable = agents.filter((agent) => agent.mcpSupported);
  if (mcpCapable.length === 0) {
    lines.push(
      '→ assistant tools - your detected assistant does not use project tool plug-ins yet; official docs fallback still works.',
    );
  } else {
    const mcpDeps = resolveMcpWireDeps(deps);
    const coreServers = readCoreMcpServerNames(cwd, mcpDeps);
    const mcpNames = mcpCapable.map((agent) => agent.name).join(', ');
    if (coreServers.length > 0) {
      // Project has catalog — actually wire core tools (Track 2 slice B).
      const wireResult = wireCoreMcps(cwd, agents, mcpDeps);
      if (!wireResult.ok) {
        ok = false;
      }
      if (wireResult.lines.length > 0) {
        lines.push(...wireResult.lines);
      } else {
        lines.push(
          `✓ assistant tools - curated list ready for ${mcpNames} (core: ${coreServers.join(', ')}).`,
        );
        lines.push(
          '  Your agent uses these from the project catalog; secrets stay in env / sign-in, never committed.',
        );
      }
    } else {
      // Pre-create / no catalog — report-only.
      lines.push(
        `✓ assistant tools - ${mcpNames} can use project plug-ins. After create app, core tools (docs + GitHub) ship in the kit catalog.`,
      );
    }
  }

  // First-party VybeKiit MCPs (skills/CLI/automations + UI catalog) when packages are present.
  const kitRootAgentMcp = join(cwd, 'packages', 'agentMcp');
  const surfaceAgentMcp = join(cwd, '..', '..', 'packages', 'agentMcp');
  const hasKitRootMcp = deps.pathExists(kitRootAgentMcp);
  const hasSurfaceMcp = deps.pathExists(surfaceAgentMcp);
  if (hasKitRootMcp || hasSurfaceMcp) {
    try {
      const layout = hasKitRootMcp ? 'kit-root' : 'surface';
      const template =
        layout === 'kit-root'
          ? (['web', 'mobile', 'extension', 'backend', 'spa'] as const).find((name) =>
              deps.pathExists(join(cwd, 'templates', name)),
            )
          : undefined;
      const configPaths = [join(cwd, '.cursor', 'mcp.json'), join(cwd, '.mcp.json')];
      for (const configPath of configPaths) {
        await writeFirstPartyMcpConfigFile(
          configPath,
          layout,
          template === undefined ? undefined : { template },
        );
      }
      lines.push(
        '✓ kit tools - first-party assistant tools (skills, commands, automations, UI catalog) are in the project config.',
      );
    } catch {
      lines.push(
        '→ kit tools - could not refresh first-party assistant tool config. Re-run doctor after pnpm build.',
      );
    }
  }

  // Speed-check / web-perf-ci discoverability lives in perfReadiness.ts (ADR-0038 §8.2).

  return { ok, lines, agents };
};
