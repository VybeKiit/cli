import { spawnSync } from 'node:child_process';
import {
  dataConfigSchema,
  hostingConfigSchema,
  isRailwayStackActive,
  parseEnv,
  type EnvSource,
} from '@vybekiit/core';

export { isRailwayStackActive } from '@vybekiit/core';

/** Warn when only one half of the coupled Railway stack is selected. */
export function verifyCoupledStack(env: EnvSource): string | null {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  const hosting = HOSTING_PROVIDER === 'railway';
  const data = DATA_PROVIDER === 'railway';
  if (hosting && !data) {
    return '→ Railway hosting is on but your database setting is not Railway — set DATA_PROVIDER=railway for the coupled stack.';
  }
  if (data && !hosting) {
    return '→ Railway database is on but your hosting setting is not Railway — set HOSTING_PROVIDER=railway for the coupled stack.';
  }
  return null;
}

export interface RailwayAgentSetupResult {
  readonly ok: boolean;
  readonly message: string;
}

/**
 * Run Railway's bundled agent setup (skills + MCP merge + auth check).
 * Non-interactive; requires `railway` on PATH and signed in for full success.
 */
export function runRailwayAgentSetup(
  railwayInstalled: boolean,
  railwayAuthed: boolean | null,
): RailwayAgentSetupResult {
  if (!railwayInstalled) {
    return {
      ok: false,
      message: '→ Railway agent setup skipped — install the deploy CLI first.',
    };
  }
  if (railwayAuthed === false) {
    return {
      ok: false,
      message: '→ Railway agent setup skipped — sign in with `railway login` first.',
    };
  }

  const result = spawnSync('railway', ['setup', 'agent', '-y'], {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  if (result.status === 0) {
    return {
      ok: true,
      message: '✓ Railway — agent skills and MCP configuration updated.',
    };
  }
  const detail = (result.stderr || result.stdout || '').trim().split('\n')[0];
  return {
    ok: false,
    message: detail
      ? `→ Railway agent setup needs attention — ${detail}`
      : '→ Railway agent setup did not complete — run `railway setup agent -y` after signing in.',
  };
}

/** Buyer-readable lines for Railway stack checks. */
export function formatRailwayStackReport(
  env: EnvSource,
  agentSetup: RailwayAgentSetupResult | null,
): readonly string[] {
  if (!isRailwayStackActive(env)) {
    return [];
  }
  const lines: string[] = [];
  const coupling = verifyCoupledStack(env);
  if (coupling) {
    lines.push(coupling);
  }
  if (agentSetup) {
    lines.push(agentSetup.message);
  }
  return lines;
}
