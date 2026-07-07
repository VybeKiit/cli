'use client';

import { ScrollArea, SidebarProvider } from '@vybekiit/ui';
import { useEffect, useRef, useState } from 'react';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatSidebar } from '@/components/ChatSidebar';
import { WorkflowRunner } from '@/components/WorkflowRunner';
import { useAgentSessions, useDaemon } from '@/hooks';
import { useAgentStore, useChatStore } from '@/stores';

const WELCOME_MESSAGE = `Hi — I'm your VybeKiit assistant. Tell me what you'd like to build or fix, and I'll guide you step by step. Everything stays on your computer.`;

/**
 * Render the chat surface component.
 *
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <ChatInterface />;
 */
export const ChatInterface = () => {
  const conversations = useChatStore((s) => s.conversations);
  const createConversation = useChatStore((s) => s.createConversation);
  const addMessage = useChatStore((s) => s.addMessage);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const agentsMap = useAgentStore((s) => s.agents);
  const activeAgent = agentsMap[activeAgentId];
  const { refresh: refreshSessions } = useAgentSessions();
  useDaemon();

  const [activeId, setActiveId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const foundConversation = conversations.find((conversation) => conversation.id === activeId);
  const activeConversation = foundConversation === undefined ? null : foundConversation;
  const firstConversation = conversations.at(0);
  const firstConversationId = firstConversation === undefined ? null : firstConversation.id;
  const activeMessageCount = activeConversation === null ? 0 : activeConversation.messages.length;

  useEffect(() => {
    if (conversations.length === 0) {
      const c = createConversation('Getting started', activeAgent.id);
      addMessage(c.id, { role: 'agent', content: WELCOME_MESSAGE });
      setActiveId(c.id);
    } else if (!activeId) {
      setActiveId(firstConversationId);
    }
  }, [
    conversations.length,
    activeId,
    firstConversationId,
    createConversation,
    addMessage,
    activeAgent.id,
  ]);

  useEffect(() => {
    if (activeMessageCount > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessageCount]);

  return (
    <SidebarProvider defaultOpen={true} className="!min-h-0 h-screen overflow-hidden bg-zinc-950">
      <ChatSidebar activeId={activeId} onSelect={setActiveId} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold text-white sm:text-xl">VybeKiit Local Dev</h1>
            <p className="text-sm text-zinc-400">Talk to {activeAgent.name} and watch it work</p>
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl px-4 pb-6 pt-4 sm:px-6">
              <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
                <WorkflowRunner />
              </section>

              {activeConversation ? (
                <div className="space-y-1">
                  {activeConversation.messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-4 py-12 text-center text-zinc-500">
                  Select or start a conversation.
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 sm:px-6">
            <div className="mx-auto w-full max-w-3xl">
              <ChatInput
                conversationId={activeId}
                disabled={!activeConversation}
                onAgentSwitch={refreshSessions}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
