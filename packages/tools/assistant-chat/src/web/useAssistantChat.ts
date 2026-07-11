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

/** Plain-language offline copy for vibe coders (not maintainer jargon). */
export const BRIDGE_OFFLINE_MESSAGE =
  "Your coding helper isn't connected yet. Start it in a terminal, then this chat lights up.";

type ChatState = {
  readonly messages: readonly ChatMessage[];
  readonly status: ChatStatus;
  readonly error: string | null;
  /** True after the EventSource opens; false while offline or reconnecting. */
  readonly connected: boolean;
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
 * @returns Transcript state, stream status, connection flag, error text, send, and hydrate.
 * @example
 * const chat = useAssistantChat({ bridgeUrl: 'http://localhost:4319', sessionId: 'local' });
 */
export const useAssistantChat = (
  options: UseAssistantChatOptions,
): {
  readonly messages: readonly ChatMessage[];
  readonly status: ChatStatus;
  readonly error: string | null;
  readonly connected: boolean;
  readonly send: SendAssistantTurn;
  /**
   * Replace the visible transcript (e.g. after Resume loads a CLI session).
   * Safe to call after `sessionId` changes; does not touch the EventSource.
   */
  readonly hydrateMessages: (messages: readonly ChatMessage[]) => void;
} => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    status: 'idle',
    error: null,
    connected: false,
  });
  useBridgeEvents(options, setState);
  const send = useSendAssistantTurn(options, setState);
  const hydrateMessages = useCallback((messages: readonly ChatMessage[]): void => {
    setState((prev) => ({
      ...prev,
      messages: messages.map((message) => ({
        role: message.role,
        text: message.text,
        ...(message.attachments === undefined ? {} : { attachments: message.attachments }),
      })),
      status: 'idle',
      // Keep connection/error as-is so hydrate does not flash offline.
    }));
  }, []);

  return {
    messages: state.messages,
    status: state.status,
    error: state.error,
    connected: state.connected,
    send,
    hydrateMessages,
  };
};

const useBridgeEvents = (options: UseAssistantChatOptions, setState: SetChatState): void => {
  useEffect(() => {
    // New session id = fresh transcript (New chat / Resume pick).
    setState({
      messages: [],
      status: 'idle',
      error: null,
      connected: false,
    });

    const url = `${options.bridgeUrl}/events?session=${encodeURIComponent(options.sessionId)}`;
    const source = new EventSource(url);

    source.onopen = () => {
      setState((prev) => ({
        ...prev,
        connected: true,
        // Keep streaming status if a turn is mid-flight; only clear sticky offline errors.
        status: prev.status === 'error' ? 'idle' : prev.status,
        error: null,
      }));
    };

    source.onmessage = (event) => applyEvent(setState, parseBridgeEvent(event.data));

    source.onerror = () => {
      setState((prev) => ({
        ...prev,
        connected: false,
        status: 'error',
        error: BRIDGE_OFFLINE_MESSAGE,
      }));
    };

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
          ...(turn.assistant === undefined ? {} : { assistant: turn.assistant }),
          ...(turn.model === undefined ? {} : { model: turn.model }),
          ...(turn.agentSessionId !== undefined && turn.agentSessionId.length > 0
            ? { agentSessionId: turn.agentSessionId }
            : {}),
          ...(turn.cwd !== undefined && turn.cwd.length > 0 ? { cwd: turn.cwd } : {}),
          ...(wireAttachments.length > 0 ? { attachments: wireAttachments } : {}),
        }),
      }).catch((cause: unknown) =>
        setState((prev) => ({
          ...prev,
          status: 'error',
          connected: false,
          error:
            cause instanceof Error
              ? cause.message
              : "Couldn't send that message. Check that your coding helper is running.",
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
    // Bridge status is only starting | streaming | idle (errors arrive as `type: 'error'`).
    setState((prev) => ({
      ...prev,
      status: event.state,
      connected: true,
      error: null,
    }));
    return;
  }

  if ('text' in event) {
    setState((prev) => ({
      ...prev,
      connected: true,
      error: null,
      messages: appendToken(prev.messages, event.text),
    }));
    return;
  }

  if ('message' in event) {
    setState((prev) => ({ ...prev, status: 'error', error: event.message }));
    return;
  }

  if ('name' in event || 'usage' in event) {
    return;
  }

  setState((prev) => ({ ...prev, status: 'idle', connected: true, error: null }));
};

const appendToken = (messages: readonly ChatMessage[], text: string): readonly ChatMessage[] => {
  const last = messages.at(-1);
  if (last?.role !== 'assistant') {
    return [...messages, { role: 'assistant', text }];
  }
  return [...messages.slice(0, -1), { role: 'assistant', text: last.text + text }];
};
