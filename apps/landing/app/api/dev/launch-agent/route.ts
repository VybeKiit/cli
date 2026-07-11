import { VybeAssistantSchema } from '@vybekiit/assistant-chat';
import { launchAgentInTerminal } from '@vybekiit/assistant-chat/node';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { Schema } from 'effect';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NonEmpty = Schema.String.pipe(Schema.minLength(1));

/** Trim + lowercase before matching a known assistant id. */
const NormalizedAssistantSchema = Schema.compose(
  Schema.transform(Schema.String, Schema.String, {
    decode: (value) => value.trim().toLowerCase(),
    encode: (value) => value,
  }),
  VybeAssistantSchema,
);

/**
 * Dev-only launch body.
 *
 * Schema steps:
 * 1. Normalize `assistant` and require a known Vybe assistant id.
 * 2. Accept optional `mode` (`new` default, or `resume`).
 * 3. Reject `resume` when `sessionId` is missing.
 */
const LaunchAgentBodySchema = Schema.Struct({
  assistant: NormalizedAssistantSchema,
  mode: Schema.optionalWith(Schema.Literal('new', 'resume'), { default: () => 'new' as const }),
  sessionId: Schema.optional(NonEmpty),
  prompt: Schema.optional(Schema.String),
  cwd: Schema.optional(NonEmpty),
}).pipe(
  Schema.filter((body) => body.mode !== 'resume' || body.sessionId !== undefined, {
    message: () => 'Resume requires sessionId.',
  }),
);

/**
 * Dev-only: open a real terminal with the selected agent CLI (new or resume).
 *
 * @param request - JSON body with assistant + mode.
 * @returns Launch result for the browser panel.
 * @example
 * POST /api/dev/launch-agent { "assistant": "grok", "mode": "new" }
 */
export const POST = async (request: Request): Promise<Response> => {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, message: 'Dev only.' }, { status: 404 });
  }

  const json = await readRequestJson(request);
  if (!json.ok) {
    return NextResponse.json(
      { ok: false, message: json.response.body.error },
      { status: json.response.status },
    );
  }

  const parsed = decodeJsonBody(
    json.body,
    LaunchAgentBodySchema,
    'assistant must be a supported agent id.',
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, message: parsed.response.body.error },
      { status: parsed.response.status },
    );
  }

  const { assistant, mode, sessionId, prompt, cwd } = parsed.body;

  try {
    const result = await launchAgentInTerminal({
      assistant,
      mode,
      cwd: cwd ?? process.cwd(),
      ...(sessionId === undefined ? {} : { sessionId }),
      ...(prompt === undefined ? {} : { prompt }),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Launch failed.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
};
