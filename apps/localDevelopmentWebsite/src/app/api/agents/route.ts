import { NextResponse } from 'next/server';
import { detectInstalledAgents } from '@/lib/agents';

/**
 * List registered agents and whether their CLI is installed on this machine.
 *
 * @returns JSON list of agents with install status.
 * @example
 * const response = await GET();
 */
export const GET = async () => {
  // In e2e, mark a stable subset as installed without probing the host.
  if (process.env.NEXT_PUBLIC_E2E === '1') {
    const agents = await detectInstalledAgents();
    return NextResponse.json({
      agents: agents.map((a) => ({
        ...a,
        // Keep list stable; e2e only asserts UI structure.
        installed: a.id === 'kiro' || a.id === 'claude-code' || a.id === 'codex',
      })),
    });
  }

  const agents = await detectInstalledAgents();
  return NextResponse.json({ agents });
};
