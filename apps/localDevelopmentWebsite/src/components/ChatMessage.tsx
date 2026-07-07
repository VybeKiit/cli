'use client';

import { Avatar, AvatarFallback } from '@vybekiit/ui';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/stores';

type ChatMessageProps = {
  message: ChatMessageType;
};

/**
 * Render the chat message component.
 *
 * @param message - Chat message to render.
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <ChatMessage message={message} />;
 */
export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 px-2 py-4 sm:px-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar
        className={cn('h-8 w-8 shrink-0 border', isUser ? 'border-vybe-500/30' : 'border-zinc-700')}
      >
        <AvatarFallback
          className={cn(
            'text-xs',
            isUser ? 'bg-vybe-950 text-vybe-300' : 'bg-zinc-900 text-zinc-300',
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser ? 'bg-vybe-600 text-white' : 'border border-zinc-800 bg-zinc-900/60 text-zinc-100',
        )}
      >
        {message.content}
      </div>
    </div>
  );
};
