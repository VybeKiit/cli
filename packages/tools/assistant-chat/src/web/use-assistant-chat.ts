'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SendTurnOptions } from '../capabilities';
import type { PageContext } from '../context';
import { type AttachmentPayload, type BridgeEvent, parseBridgeEvent } from '../protocol';

export type ChatStatus = 'idle' | 'starting' | 'streaming' | 'error';

/** A file shown against a user turn in the transcript — carries a preview URL + byte size. */
export interface ChatAttachment {
  readonly filename: string;
  readonly mediaType: string;
  /** Object/data URL for inline rendering (images) — set by the UI, not the wire. */
  readonly url: string;
  readonly size: number;
}

export interface ChatMessage {
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly attachments?: readonly ChatAttachment[];
}

/** What the UI hands `send` for one file — the transcript view fields plus the base64 wire payload. */
export interface OutgoingAttachment extends ChatAttachment {
  readonly dataBase64: string;
}

export interface UseAssistantChatOptions {
  /** Bridge base URL, e.g. `http://localhost:4319`. */
  readonly bridgeUrl: string;
  /** Stable session id so a reconnect resumes the same stream. */
  readonly sessionId: string;
}

interface ChatState {
  readonly messages: readonly ChatMessage[];
  readonly status: ChatStatus;
  readonly error: string | null;
}

/**
 * Sidebar chat client. Opens one EventSource to the dev bridge and POSTs each user
 * turn with the live page context. All agent logic lives in the bridge — this hook
 * only streams tokens into message state.
 */
export function useAssistantChat(options: UseAssistantChatOptions): {
  readonly messages: readonly ChatMessage[];
  readonly status: ChatStatus;
  readonly error: string | null;
  readonly send: (
    text: string,
    context: PageContext,
    turn?: SendTurnOptions,
    attachments?: readonly OutgoingAttachment[],
  ) => void;
} {
  const [state, setState] = useState<ChatState>({ messages: [], status: 'idle', error: null });
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `${options.bridgeUrl}/events?session=${encodeURIComponent(options.sessionId)}`;
    const source = new EventSource(url);
    sourceRef.current = source;
    source.onmessage = (event) => applyEvent(setState, parseBridgeEvent(event.data));
    source.onerror = () =>
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Bridge disconnected — is the dev bridge running?',
      }));
    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [options.bridgeUrl, options.sessionId]);

  const send = useCallback(
    (
      text: string,
      context: PageContext,
      turn: SendTurnOptions = {},
      attachments: readonly OutgoingAttachment[] = [],
    ) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) {
        return;
      }
      const viewAttachments = attachments.map(
        ({ filename, mediaType, url, size }): ChatAttachment => ({
          filename,
          mediaType,
          url,
          size,
        }),
      );
      const wireAttachments: AttachmentPayload[] = attachments.map(
        ({ filename, mediaType, dataBase64 }) => ({ filename, mediaType, dataBase64 }),
      );
      setState((prev) => ({
        ...prev,
        status: 'starting',
        error: null,
        messages: [
          ...prev.messages,
          {
            role: 'user',
            text: trimmed,
            ...(viewAttachments.length ? { attachments: viewAttachments } : {}),
          },
          { role: 'assistant', text: '' },
        ],
      }));
      void fetch(`${options.bridgeUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: options.sessionId,
          text: trimmed,
          context,
          ...turn,
          ...(wireAttachments.length ? { attachments: wireAttachments } : {}),
        }),
      }).catch((cause: unknown) =>
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: cause instanceof Error ? cause.message : 'send failed',
        })),
      );
    },
    [options.bridgeUrl, options.sessionId],
  );

  return { messages: state.messages, status: state.status, error: state.error, send };
}

function applyEvent(
  setState: (fn: (prev: ChatState) => ChatState) => void,
  event: BridgeEvent,
): void {
  switch (event.type) {
    case 'status':
      setState((prev) => ({ ...prev, status: event.state }));
      return;
    case 'token':
      setState((prev) => ({ ...prev, messages: appendToken(prev.messages, event.text) }));
      return;
    case 'error':
      setState((prev) => ({ ...prev, status: 'error', error: event.message }));
      return;
    case 'done':
      setState((prev) => ({ ...prev, status: 'idle' }));
      return;
    default:
      return;
  }
}

function appendToken(messages: readonly ChatMessage[], text: string): readonly ChatMessage[] {
  const last = messages.at(-1);
  if (!last || last.role !== 'assistant') {
    return [...messages, { role: 'assistant', text }];
  }
  return [...messages.slice(0, -1), { role: 'assistant', text: last.text + text }];
}
