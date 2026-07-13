'use client';

import { Avatar, AvatarFallback, SkeletonPulse } from '@vybekiit/ui';
import { User } from 'lucide-react';
import { AgentMark } from '@/components/AgentMark';
import type { AgentId } from '@/lib/agents/registry';
import { isAgentId } from '@/lib/agents/registry';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/stores';
import { useAgentStore } from '@/stores';

type ChatMessageProps = {
  message: ChatMessageType;
  /** Conversation agent when the message has no agentId of its own. */
  conversationAgentId?: string;
};

/**
 * Render one chat bubble with the active agent brand mark (or user avatar).
 *
 * @param message - Chat message to render.
 * @param conversationAgentId - Fallback agent for logo when not on the message.
 * @returns A React element for the local dev Console UI.
 * @example
 * <ChatMessage message={msg} conversationAgentId="claude-code" />
 */
export const ChatMessage = ({ message, conversationAgentId }: ChatMessageProps) => {
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const isUser = message.role === 'user';
  const isStreaming = message.content.trim().length === 0 && !isUser;

  let agentSlug: AgentId = activeAgentId;
  if (conversationAgentId !== undefined && isAgentId(conversationAgentId)) {
    agentSlug = conversationAgentId;
  }

  return (
    <div
      className={cn('flex gap-3 px-2 py-4 sm:px-4', isUser ? 'flex-row-reverse' : 'flex-row')}
      data-testid={isUser ? 'chat-message-user' : 'chat-message-agent'}
    >
      {isUser ? (
        <Avatar className="h-8 w-8 shrink-0 border border-vybe-500/30">
          <AvatarFallback className="bg-vybe-950 text-xs text-vybe-300">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card"
          data-testid="chat-message-agent-logo"
        >
          <AgentMark slug={agentSlug} size={20} />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser ? 'bg-vybe-600 text-white' : 'border border-border bg-card/80 text-foreground',
        )}
      >
        {isStreaming ? (
          <div className="space-y-2 py-0.5" data-testid="chat-message-shimmer" aria-busy={true}>
            <SkeletonPulse width="14rem" height="12px" rounded="sm" />
            <SkeletonPulse width="10rem" height="12px" rounded="sm" />
            <SkeletonPulse width="12rem" height="12px" rounded="sm" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}
      </div>
    </div>
  );
};
