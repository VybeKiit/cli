import { parseAssistantId } from '@vybekiit/assistant-chat';
import { buildListSessionsResponse } from '@vybekiit/assistant-chat/node';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dev-only: list native CLI sessions for the active agent (Resume sheet).
 *
 * @param request - Query `assistant` id.
 * @returns Sessions newest-first for that agent only.
 * @example
 * GET /api/dev/list-sessions?assistant=claude
 */
export const GET = async (request: Request): Promise<Response> => {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, message: 'Dev only.' }, { status: 404 });
  }

  const url = new URL(request.url);
  const assistant = parseAssistantId(url.searchParams.get('assistant'));
  if (assistant === null) {
    return NextResponse.json(
      { ok: false, message: 'assistant must be a supported agent id.' },
      { status: 400 },
    );
  }

  try {
    const body = await buildListSessionsResponse(assistant);
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list sessions.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
};
