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

      deleteConversation: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== conversationId),
        }));
      },
    }),
    { name: STORE_KEYS.conversations },
  ),
);
