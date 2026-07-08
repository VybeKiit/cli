'use client';

import {
  AgentLogo,
  GlowBadge,
  PulseBeam,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  VybeKitMark,
} from '@vybekiit/ui';
import { Clock, MessageSquare, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useAgentSessions } from '@/hooks';
import { cn } from '@/lib/utils';
import { type AgentId, useAgentStore, useChatStore } from '@/stores';

type ChatSidebarProps = {
  activeId: string | null;
  onSelect: (id: string) => void;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

/**
 * Render the chat sidebar component.
 *
 * @param activeId - Currently selected local conversation id.
 * @param onSelect - Callback used when a conversation is selected.
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <ChatSidebar activeId={activeId} onSelect={setActiveId} />;
 */
export const ChatSidebar = ({ activeId, onSelect }: ChatSidebarProps) => {
  const conversations = useChatStore((s) => s.conversations);
  const createConversation = useChatStore((s) => s.createConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const addMessage = useChatStore((s) => s.addMessage);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const setActive = useAgentStore((s) => s.setActive);
  const agentsMap = useAgentStore((s) => s.agents);
  const activeAgent = agentsMap[activeAgentId];

  const { sessions, loading, refresh, createSession } = useAgentSessions();

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload sessions when the active agent changes
  useEffect(() => {
    refresh();
  }, [activeAgentId, refresh]);

  const createNew = useCallback(() => {
    const c = createConversation(`New chat \u2022 ${activeAgent.name}`, activeAgent.id);
    onSelect(c.id);
  }, [activeAgent, createConversation, onSelect]);

  const loadSessionAsConversation = useCallback(
    async (sessionId: string) => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        throw new Error(`Could not load session ${sessionId}.`);
      }

      const data = (await res.json()) as {
        session_id: string;
        title: string;
        messages: Array<{ role: string; content: string }>;
      };

      const c = createConversation(data.title || `Session ${sessionId}`, activeAgent.id);
      for (const msg of data.messages) {
        addMessage(c.id, {
          role: msg.role === 'user' ? 'user' : 'agent',
          content: msg.content,
        });
      }
      onSelect(c.id);
    },
    [activeAgent, createConversation, addMessage, onSelect],
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-zinc-800 bg-zinc-950"
      data-testid="chat-sidebar"
    >
      <SidebarHeader className="gap-4 p-4">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 text-white">
            <VybeKitMark className="h-7 w-7" />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              VybeKiit
            </span>
          </div>
          <GlowBadge color="green" size="sm">
            Local
          </GlowBadge>
        </div>

        <div className="space-y-2 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your agent</p>
          <div className="space-y-1.5">
            {(Object.keys(agentsMap) as AgentId[]).map((id) => {
              const agent = agentsMap[id];
              const selected = id === activeAgentId;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  data-testid={`agent-button-${id}`}
                  onClick={() => setActive(id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                    selected
                      ? 'bg-vybe-600 text-white shadow-lg shadow-vybe-600/20'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
                  )}
                >
                  <AgentLogo slug={id} size={20} />
                  <span>{agent.name}</span>
                  {selected && <PulseBeam color="green" size="sm" />}
                </button>
              );
            })}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            {activeAgent.name} sessions
          </SidebarGroupLabel>
          <SidebarGroupAction onClick={refresh} aria-label="Refresh sessions">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {(() => {
                if (loading && sessions.length === 0) {
                  return (
                    <p className="px-3 py-4 text-center text-sm text-zinc-500 group-data-[collapsible=icon]:hidden">
                      Loading sessions&hellip;
                    </p>
                  );
                }
                if (sessions.length === 0) {
                  return (
                    <p className="px-3 py-4 text-center text-sm text-zinc-500 group-data-[collapsible=icon]:hidden">
                      No {activeAgent.name} sessions found
                    </p>
                  );
                }
                return sessions.slice(0, 12).map((s) => (
                  <SidebarMenuItem key={s.session_id}>
                    <SidebarMenuButton
                      tooltip={s.title}
                      data-testid={`session-item-${s.session_id}`}
                      onClick={() => loadSessionAsConversation(s.session_id)}
                      className="h-auto flex-col items-start gap-0 py-2.5"
                    >
                      <span className="line-clamp-1 w-full text-sm text-zinc-200">{s.title}</span>
                      <span className="text-xs text-zinc-500">{formatTime(s.updated_at)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ));
              })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-zinc-500">
            Local chats
          </SidebarGroupLabel>
          <SidebarGroupAction onClick={createNew} aria-label="New conversation">
            <Plus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-zinc-500 group-data-[collapsible=icon]:hidden">
                  No conversations yet
                </p>
              ) : (
                conversations.map((c) => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton
                      isActive={c.id === activeId}
                      tooltip={c.title}
                      onClick={() => onSelect(c.id)}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span>{c.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover={true}
                      onClick={() => deleteConversation(c.id)}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-1 p-3">
        <SidebarMenuButton
          onClick={() => createSession(`New project \u2022 ${new Date().toLocaleDateString()}`)}
          data-testid="new-agent-session"
          className="group-data-[collapsible=icon]:justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>New {activeAgent.name} session</span>
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={createNew}
          data-testid="new-local-chat"
          className="group-data-[collapsible=icon]:justify-center text-zinc-500"
        >
          <MessageSquare className="h-4 w-4" />
          <span>New local chat</span>
        </SidebarMenuButton>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

/** Opens and closes the local development sidebar. */
export const ChatSidebarTrigger = SidebarTrigger;
export { SidebarProvider };
