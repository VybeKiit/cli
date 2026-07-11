'use client';

import { ScrollArea, SidebarProvider } from '@vybekiit/ui';
import { useEffect, useRef, useState } from 'react';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WorkflowRunner } from '@/components/WorkflowRunner';
import { useDaemon } from '@/hooks';
import { useInstalledAgents } from '@/hooks/useInstalledAgents';
import { useAgentStore, useChatStore } from '@/stores';

const WELCOME_MESSAGE = `Hi — I'm your VybeKiit assistant. Pick an installed agent on the left, then either resume a past session or send a message here. I'll open the real CLI in your terminal so the agent can work.`;

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
  useDaemon();
  useInstalledAgents();

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

  let installLabel = 'Checking CLI…';
  if (activeAgent.installed === true) {
    installLabel = 'CLI ready';
  } else if (activeAgent.installed === false) {
    installLabel = 'CLI not found';
  }

  let installLabelClassName: string | undefined;
  if (activeAgent.installed === true) {
    installLabelClassName = 'text-emerald-600 dark:text-emerald-400';
  } else if (activeAgent.installed === false) {
    installLabelClassName = 'text-amber-600 dark:text-amber-400';
  }

  return (
    <SidebarProvider defaultOpen={true} className="!min-h-0 h-screen overflow-hidden bg-background">
      <ChatSidebar activeId={activeId} onSelect={setActiveId} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">VybeKiit Local Dev</h1>
            <p className="text-sm text-muted-foreground">
              Talk to {activeAgent.name}
              <span className="mx-1.5 text-border">·</span>
              <span className={installLabelClassName}>{installLabel}</span>
            </p>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl px-4 pb-6 pt-4 sm:px-6">
              <section className="mb-6 rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
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
                <div className="flex h-full items-center justify-center px-4 py-12 text-center text-muted-foreground">
                  Select or start a conversation.
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border bg-background px-4 py-4 sm:px-6">
            <div className="mx-auto w-full max-w-3xl">
              <ChatInput conversationId={activeId} disabled={!activeConversation} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
