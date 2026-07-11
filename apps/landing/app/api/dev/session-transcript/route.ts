import { parseAssistantId } from '@vybekiit/assistant-chat';
import { loadSessionTranscript } from '@vybekiit/assistant-chat/node';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dev-only: load a native CLI conversation into chat bubbles for the panel.
 *
 * Query: `assistant` + `sessionId` (+ optional `sourcePath` from list-sessions).
 *
 * @param request - Incoming GET with query params.
 * @returns Transcript JSON or 404 when the session file is missing.
 * @example
 * GET /api/dev/session-transcript?assistant=claude&sessionId=abc-123
 */
export const GET = async (request: Request): Promise<Response> => {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, message: 'Dev only.' }, { status: 404 });
  }

  const url = new URL(request.url);
  const assistant = parseAssistantId(url.searchParams.get('assistant'));
  const sessionId = url.searchParams.get('sessionId')?.trim() ?? '';
  const sourcePath = url.searchParams.get('sourcePath')?.trim() ?? '';

  if (assistant === null) {
    return NextResponse.json(
      { ok: false, message: 'assistant must be a supported agent id.' },
      { status: 400 },
    );
  }
  if (sessionId.length === 0) {
    return NextResponse.json({ ok: false, message: 'sessionId is required.' }, { status: 400 });
  }

  try {
    const transcript = await loadSessionTranscript(
      assistant,
      sessionId,
      sourcePath.length > 0 ? sourcePath : undefined,
    );
    if (transcript === null) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Could not load that chat history. You can still send a message to continue the session.',
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, ...transcript });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load transcript.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
};
