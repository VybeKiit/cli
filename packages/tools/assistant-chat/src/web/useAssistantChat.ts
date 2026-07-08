'use client';

import type { SendTurnOptions } from '@vybekiit/assistant-chat/capabilities';
import type { PageContext } from '@vybekiit/assistant-chat/context';
import {
  type AttachmentPayload,
  type BridgeEventPayload,
  parseBridgeEvent,
} from '@vybekiit/assistant-chat/protocol';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';

/** Streaming lifecycle state exposed by the assistant chat hook. */
export type ChatStatus = 'idle' | 'starting' | 'streaming' | 'error';

/** A file shown against a user turn in the transcript with preview metadata. */
export type ChatAttachment = {
  readonly filename: string;
  readonly mediaType: string;
  /** Object/data URL for inline rendering, set by the UI rather than the wire payload. */
  readonly url: string;
  readonly size: number;
};

/** One transcript message in the assistant chat sidebar. */
export type ChatMessage = {
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly attachments?: readonly ChatAttachment[];
};

/** One outgoing attachment with transcript metadata plus the base64 wire payload. */
export type OutgoingAttachment = ChatAttachment & {
  readonly dataBase64: string;
};

/** Options required to connect the chat hook to the local bridge. */
export type UseAssistantChatOptions = {
  /** Bridge base URL, e.g. `http://localhost:4319`. */
  readonly bridgeUrl: string;
  /** Stable session id so a reconnect resumes the same stream. */
  readonly sessionId: string;
};

type ChatState = {
  readonly messages: readonly ChatMessage[];
  readonly status: ChatStatus;
  readonly error: string | null;
};

type SetChatState = Dispatch<SetStateAction<ChatState>>;

type SendAssistantTurn = (
  text: string,
  context: PageContext,
  turn?: SendTurnOptions,
  attachments?: readonly OutgoingAttachment[],
) => void;

/**
 * Sidebar chat client. Opens one EventSource to the dev bridge and POSTs each user
 * turn with the live page context.
 *
 * @param options - Bridge URL and stable session id.
 * @returns Transcript state, stream status, error text, and a send callback.
 * @example
 * const chat = useAssistantChat({ bridgeUrl: 'http://localhost:4319', sessionId: 'local' });
 */
export const useAssistantChat = (
  options: UseAssistantChatOptions,
): {
  readonly messages: readonly ChatMessage[];
  readonly status: ChatStatus;
  readonly error: string | null;
  readonly send: SendAssistantTurn;
} => {
  const [state, setState] = useState<ChatState>({ messages: [], status: 'idle', error: null });
  useBridgeEvents(options, setState);
  const send = useSendAssistantTurn(options, setState);

  return { messages: state.messages, status: state.status, error: state.error, send };
};

const useBridgeEvents = (options: UseAssistantChatOptions, setState: SetChatState): void => {
  useEffect(() => {
    const url = `${options.bridgeUrl}/events?session=${encodeURIComponent(options.sessionId)}`;
    const source = new EventSource(url);
    source.onmessage = (event) => applyEvent(setState, parseBridgeEvent(event.data));
    source.onerror = () =>
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Bridge disconnected - is the dev bridge running?',
      }));
    return () => {
      source.close();
    };
  }, [options.bridgeUrl, options.sessionId, setState]);
};

const useSendAssistantTurn = (
  options: UseAssistantChatOptions,
  setState: SetChatState,
): SendAssistantTurn =>
  useCallback(
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
            ...(viewAttachments.length > 0 ? { attachments: viewAttachments } : {}),
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
          ...(wireAttachments.length > 0 ? { attachments: wireAttachments } : {}),
        }),
      }).catch((cause: unknown) =>
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: cause instanceof Error ? cause.message : 'send failed',
        })),
      );
    },
    [options.bridgeUrl, options.sessionId, setState],
  );

const applyEvent = (
  setState: (fn: (prev: ChatState) => ChatState) => void,
  event: BridgeEventPayload,
): void => {
  if ('state' in event) {
    setState((prev) => ({ ...prev, status: event.state }));
    return;
  }

  if ('text' in event) {
    setState((prev) => ({ ...prev, messages: appendToken(prev.messages, event.text) }));
    return;
  }

  if ('message' in event) {
    setState((prev) => ({ ...prev, status: 'error', error: event.message }));
    return;
  }

  if ('name' in event || 'usage' in event) {
    return;
  }

  setState((prev) => ({ ...prev, status: 'idle' }));
};

const appendToken = (messages: readonly ChatMessage[], text: string): readonly ChatMessage[] => {
  const last = messages.at(-1);
  if (last?.role !== 'assistant') {
    return [...messages, { role: 'assistant', text }];
  }
  return [...messages.slice(0, -1), { role: 'assistant', text: last.text + text }];
};
