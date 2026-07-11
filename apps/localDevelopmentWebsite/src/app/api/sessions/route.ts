import { NextResponse } from 'next/server';
import { isAgentId, listAgentSessions } from '@/lib/agents';

/**
 * List local agent sessions for the requested agent.
 *
 * @param request - Incoming request with optional agent, cwd, and limit query params.
 * @returns JSON response containing session rows for the active agent.
 * @example
 * const response = await GET(request);
 */
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const cwd = searchParams.get('cwd');
  const limitParam = searchParams.get('limit');
  const requestedAgent = searchParams.get('agent');
  const agentParam = requestedAgent === null ? 'kiro' : requestedAgent;

  if (!isAgentId(agentParam)) {
    return NextResponse.json({ error: `Unsupported agent: ${agentParam}` }, { status: 400 });
  }

  let limit = 30;
  if (limitParam !== null) {
    const parsed = Number.parseInt(limitParam, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return NextResponse.json({ error: `Invalid session limit: ${limitParam}` }, { status: 400 });
    }
    limit = parsed;
  }

  // Playwright sets NEXT_PUBLIC_E2E=1 so e2e never waits on a large local session tree.
  if (process.env.NEXT_PUBLIC_E2E === '1') {
    return NextResponse.json({
      agent: agentParam,
      sessions: [],
      total: 0,
    });
  }

  try {
    const sessions = await listAgentSessions(agentParam, cwd, limit);
    return NextResponse.json({
      agent: agentParam,
      sessions,
      total: sessions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list sessions';
    return NextResponse.json(
      { error: message, agent: agentParam, sessions: [], total: 0 },
      {
        status: 500,
      },
    );
  }
};
