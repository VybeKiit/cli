'use client';

import { ScrollArea, SidebarProvider } from '@vybekiit/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentBadge } from '@/components/AgentBadge';
import { AgentCarousel } from '@/components/AgentCarousel';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatSidebar, ChatSidebarTrigger } from '@/components/ChatSidebar';
import { WorkflowRunner } from '@/components/WorkflowRunner';
import { useAgentSessions } from '@/hooks';
import { cn } from '@/lib/utils';
import { useAgentStore, useChatStore } from '@/stores';

const WELCOME_MESSAGE = `Hi — I'm your VybeKiit agent. I can scaffold your SaaS, wire auth, payments, and deploy it. Try asking me to "ship the full SaaS workflow" and watch the steps complete.`;

export const ChatInterface = () => {
  const conversations = useChatStore((s) => s.conversations);
  const createConversation = useChatStore((s) => s.createConversation);
  const addMessage = useChatStore((s) => s.addMessage);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const agentsMap = useAgentStore((s) => s.agents);
  const activeAgent = agentsMap[activeAgentId];
  const { refresh: refreshSessions } = useAgentSessions();

  const [activeId, setActiveId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    if (conversations.length === 0) {
      const c = createConversation('Getting started', activeAgent.id);
      addMessage(c.id, { role: 'agent', content: WELCOME_MESSAGE });
      setActiveId(c.id);
    } else if (!activeId) {
      setActiveId(conversations[0]?.id ?? null);
    }
  }, [conversations.length, activeId, createConversation, addMessage, activeAgent.id]);

  useEffect(() => {
    if (activeConversation && activeConversation.messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages.length]);

  const handleAgentSwitch = useCallback(() => {
    refreshSessions();
  }, [refreshSessions]);

  return (
    <SidebarProvider defaultOpen={true} className="!min-h-0 h-screen overflow-hidden bg-zinc-950">
      {/* Sidebar — sits as direct child of SidebarProvider */}
      <ChatSidebar activeId={activeId} onSelect={setActiveId} />

      {/* Main content area — fills remaining space */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AgentCarousel />

        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <ChatSidebarTrigger className="text-zinc-400 hover:text-zinc-100" />
            <h1 className="font-bold text-base text-white sm:text-lg">
              VybeKiit <span className="text-vybe-400">Chat</span>
            </h1>
          </div>
          <AgentBadge agent={activeAgent} pulse={true} />
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex min-w-0 flex-1 flex-col">
            <ScrollArea className="flex-1">
              {activeConversation ? (
                <div className="mx-auto max-w-3xl px-2 pb-4 sm:px-4 sm:pb-6">
                  {activeConversation.messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-zinc-500">
                  Select or start a conversation.
                </div>
              )}
            </ScrollArea>

            <div className="mx-auto w-full max-w-3xl px-2 pb-3 sm:px-4 sm:pb-4">
              <ChatInput
                conversationId={activeId}
                disabled={!activeConversation}
                onAgentSwitch={handleAgentSwitch}
              />
            </div>
          </main>

          <aside
            className={cn(
              'hidden min-w-0 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-950/30 xl:block',
              'w-[420px]',
            )}
          >
            <div className="p-4">
              <h3 className="mb-3 font-semibold text-zinc-200">Live workflow</h3>
              <WorkflowRunner compact={true} />
            </div>
          </aside>
        </div>
      </div>
    </SidebarProvider>
  );
};
