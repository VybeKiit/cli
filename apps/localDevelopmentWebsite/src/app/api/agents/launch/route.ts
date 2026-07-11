import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { Schema } from 'effect';
import { NextResponse } from 'next/server';
import { AGENT_IDS, type AgentId, type LaunchMode, launchAgentInTerminal } from '@/lib/agents';

const NonEmpty = Schema.String.pipe(Schema.minLength(1));

const AgentIdSchema = Schema.Literal(...AGENT_IDS);

/**
 * Launch-agent POST body.
 *
 * Schema steps:
 * 1. Require a registered `agent` id from {@link AGENT_IDS}.
 * 2. Accept optional `mode` (`new` default, or `resume`).
 * 3. Reject `resume` when `sessionId` is missing.
 */
const LaunchBodySchema = Schema.Struct({
  agent: AgentIdSchema,
  mode: Schema.optionalWith(Schema.Literal('new', 'resume'), { default: () => 'new' as const }),
  sessionId: Schema.optional(NonEmpty),
  prompt: Schema.optional(Schema.String),
  cwd: Schema.optional(NonEmpty),
}).pipe(
  Schema.filter((body) => body.mode !== 'resume' || body.sessionId !== undefined, {
    message: () => 'sessionId is required for resume',
  }),
);

/**
 * Launch or resume an agent CLI in a local terminal window.
 *
 * @param request - JSON body: { agent, mode: 'new'|'resume', sessionId?, prompt?, cwd? }.
 * @returns Launch result with command text and whether Terminal was opened.
 * @example
 * const response = await POST(request);
 */
export const POST = async (request: Request) => {
  const json = await readRequestJson(request);
  if (!json.ok) {
    return NextResponse.json({ error: json.response.body.error }, { status: json.response.status });
  }

  const parsed = decodeJsonBody(json.body, LaunchBodySchema, 'Invalid launch body');
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.response.body.error },
      { status: parsed.response.status },
    );
  }

  const agent: AgentId = parsed.body.agent;
  const mode: LaunchMode = parsed.body.mode;
  const { sessionId, prompt, cwd } = parsed.body;

  // e2e: never open a real Terminal — return a dry-run success.
  if (process.env.NEXT_PUBLIC_E2E === '1') {
    return NextResponse.json({
      ok: true,
      command: mode === 'resume' ? `${agent} resume ${sessionId}` : `${agent} new`,
      cwd: cwd ?? process.cwd(),
      launched: false,
      message: 'E2E dry-run — terminal not opened.',
    });
  }

  try {
    const result = await launchAgentInTerminal({
      agentId: agent,
      mode,
      sessionId,
      prompt,
      cwd,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Launch failed';
    return NextResponse.json({ error: message, ok: false }, { status: 500 });
  }
};
