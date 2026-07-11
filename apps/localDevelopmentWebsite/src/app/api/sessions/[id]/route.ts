import { NextResponse } from 'next/server';
import { isAgentId, loadSessionDetail } from '@/lib/agents';

/**
 * Fetch a single session by ID for the given agent (query ?agent=).
 *
 * @param request - Incoming request; agent query param required for non-Kiro.
 * @param context - Route params containing the session id.
 * @returns JSON response with hydrated session detail.
 * @example
 * const response = await GET(request, { params: Promise.resolve({ id: 'abc' }) });
 */
export const GET = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const agentParam = searchParams.get('agent') ?? 'kiro';

  if (!isAgentId(agentParam)) {
    return NextResponse.json({ error: `Unsupported agent: ${agentParam}` }, { status: 400 });
  }

  try {
    const detail = await loadSessionDetail(agentParam, id);
    if (detail === null) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
