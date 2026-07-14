import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORE_KEYS } from '@/lib/keys';

export type MessageRole = 'user' | 'agent';

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  workflowStepId?: string;
  /** True while an agent message is still being streamed in token by token. */
  streaming?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  agentId: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

type ChatState = {
  conversations: Conversation[];
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  /** Append a streamed agent chunk, growing the in-flight agent bubble (or starting one). */
  appendAssistantDelta: (conversationId: string, text: string) => void;
  /** Mark the in-flight agent bubble complete so the next turn starts a fresh one. */
  finalizeAssistant: (conversationId: string) => void;
  createConversation: (title: string, agentId: string) => Conversation;
  deleteConversation: (conversationId: string) => void;
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],

      createConversation: (title, agentId) => {
        const conversation: Conversation = {
          id: uid(),
          title,
          agentId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        set((s) => ({ conversations: [conversation, ...s.conversations] }));
        return conversation;
      },

      addMessage: (conversationId, message) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, { ...message, id: uid(), timestamp: Date.now() }],
                }
              : c,
          ),
        }));
      },

      appendAssistantDelta: (conversationId, text) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) {
              return c;
            }
            const last = c.messages.at(-1);
            if (last !== undefined && last.role === 'agent' && last.streaming === true) {
              const grown: ChatMessage = { ...last, content: last.content + text };
              return { ...c, updatedAt: Date.now(), messages: [...c.messages.slice(0, -1), grown] };
            }
            const started: ChatMessage = {
              id: uid(),
              role: 'agent',
              content: text,
              timestamp: Date.now(),
              streaming: true,
            };
            return { ...c, updatedAt: Date.now(), messages: [...c.messages, started] };
          }),
        }));
      },

      finalizeAssistant: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) {
              return c;
            }
            const last = c.messages.at(-1);
            if (last === undefined || last.role !== 'agent' || last.streaming !== true) {
              return c;
            }
            const done: ChatMessage = { ...last, streaming: false };
            return { ...c, messages: [...c.messages.slice(0, -1), done] };
          }),
        }));
      },

      deleteConversation: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== conversationId),
        }));
      },
    }),
    { name: STORE_KEYS.conversations },
  ),
);
