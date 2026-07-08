import { Schema } from 'effect';

/**
 * Wire protocol between the dev bridge (Node, spawns the agent CLI) and the sidebar
 * UI (browser, EventSource). One discriminated union of events streams agent to UI; the
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
/** Static payload union inferred from {@link BridgeEvent}. */
export type BridgeEventPayload =
  | { readonly type: 'status'; readonly state: 'starting' | 'streaming' | 'idle' }
  | { readonly type: 'token'; readonly text: string }
  | { readonly type: 'tool_call'; readonly name: string; readonly detail?: string | undefined }
  | { readonly type: 'usage'; readonly usage: unknown }
  | { readonly type: 'error'; readonly message: string }
  | { readonly type: 'done'; readonly exitCode?: number | undefined };

/** Backward-compatible bridge event alias used by callers during the Schema migration. */
export type BridgeEvent = BridgeEventPayload;

/** A file the builder attached to a turn, base64 encoded so it rides the same JSON POST. */
export const AttachmentPayload = Schema.Struct({
  filename: Schema.String,
  mediaType: Schema.String,
  dataBase64: Schema.String,
});
/** Static type inferred from {@link AttachmentPayload}. */
export type AttachmentPayload = Schema.Schema.Type<typeof AttachmentPayload>;

/** UI to bridge: send a user turn. `context` is the live page snapshot. */
export const SendMessageRequest = Schema.Struct({
  sessionId: Schema.String,
  text: Schema.String,
  context: Schema.optional(Schema.Unknown),
  attachments: Schema.optional(Schema.Array(AttachmentPayload)),
});
/** Static type inferred from {@link SendMessageRequest}. */
export type SendMessageRequest = Schema.Schema.Type<typeof SendMessageRequest>;

const encodeEvent = Schema.encodeSync(Schema.parseJson(BridgeEvent));
const decodeEvent = Schema.decodeUnknownSync(Schema.parseJson(BridgeEvent));

/**
 * Serialize a bridge event to one SSE data payload.
 *
 * @param event - Valid bridge event to encode.
 * @returns A JSON string safe to write after `data:`.
 * @example
 * const line = serializeBridgeEvent({ type: 'status', state: 'starting' });
 */
export const serializeBridgeEvent = (event: BridgeEvent): string => encodeEvent(event);

/**
 * Parse a JSON event payload from the bridge.
 *
 * @param payload - JSON string read from an SSE message.
 * @returns The decoded bridge event.
 * @example
 * const event = parseBridgeEvent('{"type":"done"}');
 */
export const parseBridgeEvent = (payload: string): BridgeEvent => decodeEvent(payload);
