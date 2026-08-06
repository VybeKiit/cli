import { spawnSync } from 'node:child_process';
import {
  dataConfigSchema,
  type EnvSource,
  hostingConfigSchema,
  isRailwayStackActive as isCoreRailwayStackActive,
  parseEnv,
} from '@vybekiit/core';

/** True when either Railway hosting or data is active (core ADR signal). */
export const isRailwayStackActive = (processEnv: EnvSource): boolean =>
  isCoreRailwayStackActive(processEnv);

/** Buyer-readable warning when only one half of the coupled Railway stack is selected. */
export const verifyCoupledStack = (processEnv: EnvSource): string | null => {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, processEnv);
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, processEnv);
  const railwayOwnsHosting = HOSTING_PROVIDER === 'railway';
  const railwayOwnsData = DATA_PROVIDER === 'railway';
  if (railwayOwnsHosting && !railwayOwnsData) {
    return '→ Railway hosting is on but your database setting is not Railway - set DATA_PROVIDER=railway for the coupled stack.';
  }
  if (railwayOwnsData && !railwayOwnsHosting) {
    return '→ Railway database is on but your hosting setting is not Railway - set HOSTING_PROVIDER=railway for the coupled stack.';
  }
  return null;
};

export type RailwayAgentSetupStatus = {
  readonly ok: boolean;
  readonly message: string;
};

/**
 * Run Railway's bundled agent setup (skills + MCP merge + auth check).
 * Non-interactive; requires `railway` on PATH and signed in for full success.
 */
export const runRailwayAgentSetup = (
  railwayInstalled: boolean,
  railwayAuthed: boolean | null,
): RailwayAgentSetupStatus => {
  if (!railwayInstalled) {
    return {
      ok: false,
      message: '→ Railway agent setup skipped - install the deploy CLI first.',
    };
  }
  if (railwayAuthed === false) {
    return {
      ok: false,
      message: '→ Railway agent setup skipped - sign in with `railway login` first.',
    };
  }

  const agentSetupProcess = spawnSync('railway', ['setup', 'agent', '-y'], {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  if (agentSetupProcess.status === 0) {
    return {
      ok: true,
      message: '✓ Railway - agent skills and MCP configuration updated.',
    };
  }
  const [detail] = `${agentSetupProcess.stderr}${agentSetupProcess.stdout}`.trim().split('\n');
  return {
    ok: false,
    message: detail
      ? `→ Railway agent setup needs attention - ${detail}`
      : '→ Railway agent setup did not complete - run `railway setup agent -y` after signing in.',
  };
};

/** Doctor lines for active Railway stacks (coupling warning + agent setup). */
export const formatRailwayStackReport = (
  processEnv: EnvSource,
  agentSetup: RailwayAgentSetupStatus | null,
): readonly string[] => {
  if (!isRailwayStackActive(processEnv)) {
    return [];
  }
  const lines: string[] = [];
  const coupling = verifyCoupledStack(processEnv);
  if (coupling) {
    lines.push(coupling);
  }
  if (agentSetup) {
    lines.push(agentSetup.message);
  }
  return lines;
};
