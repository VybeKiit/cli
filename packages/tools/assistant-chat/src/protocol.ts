import { Schema } from 'effect';

/**
 * Wire protocol between the dev bridge (Node, spawns the agent CLI) and the sidebar
 * UI (browser, EventSource). One discriminated union of events streams agent→UI; the
 * UI sends plain JSON requests back over POST. Kept framework-free so the same seam
 * works whether the transport is SSE, a WebSocket, or an in-process pipe.
 */

/** A single streamed event from the bridge to the UI. */
export const BridgeEvent = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('status'),
    state: Schema.Literal('starting', 'streaming', 'idle'),
  }),
  Schema.Struct({ type: Schema.Literal('token'), text: Schema.String }),
  Schema.Struct({
    type: Schema.Literal('tool_call'),
    name: Schema.String,
    detail: Schema.optional(Schema.String),
  }),
  Schema.Struct({ type: Schema.Literal('usage'), usage: Schema.Unknown }),
  Schema.Struct({ type: Schema.Literal('error'), message: Schema.String }),
  Schema.Struct({ type: Schema.Literal('done'), exitCode: Schema.optional(Schema.Number) }),
);
export type BridgeEvent = Schema.Schema.Type<typeof BridgeEvent>;

/** A file the builder attached to a turn — base64 so it rides the same JSON POST. */
export const AttachmentPayload = Schema.Struct({
  filename: Schema.String,
  mediaType: Schema.String,
  dataBase64: Schema.String,
});
export type AttachmentPayload = Schema.Schema.Type<typeof AttachmentPayload>;

/** UI → bridge: send a user turn. `context` is the live page snapshot. */
export const SendMessageRequest = Schema.Struct({
  sessionId: Schema.String,
  text: Schema.String,
  context: Schema.optional(Schema.Unknown),
  attachments: Schema.optional(Schema.Array(AttachmentPayload)),
});
export type SendMessageRequest = Schema.Schema.Type<typeof SendMessageRequest>;

const encodeEvent = Schema.encodeSync(Schema.parseJson(BridgeEvent));
const decodeEvent = Schema.decodeUnknownSync(Schema.parseJson(BridgeEvent));

/** Serialize an event to a single SSE `data:` line payload (JSON string). */
export function serializeBridgeEvent(event: BridgeEvent): string {
  return encodeEvent(event);
}

/** Parse a JSON event payload; throws on malformed input (bridge is trusted, dev-only). */
export function parseBridgeEvent(payload: string): BridgeEvent {
  return decodeEvent(payload);
}
