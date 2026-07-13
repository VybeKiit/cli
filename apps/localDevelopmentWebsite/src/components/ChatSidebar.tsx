'use client';

import {
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
  SidebarRail,
  SkeletonPulse,
  VybeKitMark,
} from '@vybekiit/ui';
import { Clock, ExternalLink, MessageSquare, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { type MouseEvent, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { AgentMark } from '@/components/AgentMark';
import { useAgentSessions } from '@/hooks';
import type { AgentId } from '@/lib/agents/registry';
import { isAgentId } from '@/lib/agents/registry';
import { cn } from '@/lib/utils';
import { useAgentStore, useChatStore } from '@/stores';

type ChatSidebarProps = {
  activeId: string | null;
  onSelect: (id: string) => void;
};

const formatTime = (iso: string) => {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
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

  const { sessions, loading, refresh, createSession, resumeSession } = useAgentSessions();

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-fetch sessions when the active agent changes
  useEffect(() => {
    refresh();
  }, [activeAgentId, refresh]);

  const createNew = useCallback(() => {
    const c = createConversation(`New chat · ${activeAgent.name}`, activeAgent.id);
    onSelect(c.id);
  }, [activeAgent, createConversation, onSelect]);

  const loadSessionAsConversation = useCallback(
    async (sessionId: string, cwd?: string) => {
      const res = await fetch(
        `/api/sessions/${encodeURIComponent(sessionId)}?agent=${activeAgentId}`,
      );
      if (!res.ok) {
        // Still allow resume even if we cannot hydrate messages
        toast.message('Opening session in terminal…');
        await resumeSession(sessionId, cwd);
        return;
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
      addMessage(c.id, {
        role: 'agent',
        content: `Resuming this ${activeAgent.name} session in your terminal…`,
      });
      onSelect(c.id);
      await resumeSession(sessionId, cwd);
    },
    [activeAgent, activeAgentId, createConversation, addMessage, onSelect, resumeSession],
  );

  const handleNewAgentSession = useCallback(async () => {
    const title = `New project · ${new Date().toLocaleDateString()}`;
    await createSession(title);
    const c = createConversation(`${activeAgent.name} · ${title}`, activeAgent.id);
    addMessage(c.id, {
      role: 'agent',
      content: `Starting a new ${activeAgent.name} session in your terminal. Talk there, or come back here to watch workflow steps.`,
    });
    onSelect(c.id);
  }, [createSession, createConversation, addMessage, activeAgent, onSelect]);

  const handleResumeInTerminal = useCallback(
    (event: MouseEvent, sessionId: string, cwd?: string) => {
      event.stopPropagation();
      void resumeSession(sessionId, cwd);
    },
    [resumeSession],
  );

  const handleStartNewAgentSession = useCallback(() => {
    void handleNewAgentSession();
  }, [handleNewAgentSession]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-background"
      data-testid="chat-sidebar"
    >
      <SidebarHeader className="gap-4 p-4">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 text-foreground">
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
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your agent
          </p>
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-0.5">
            {(Object.keys(agentsMap) as AgentId[]).map((id) => {
              const agent = agentsMap[id];
              const selected = id === activeAgentId;
              const installed = agent.installed;
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
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                    installed === false && !selected && 'opacity-60',
                  )}
                >
                  <AgentMark slug={id} size={20} />
                  <span className="flex-1 min-w-0 truncate">{agent.name}</span>
                  {installed === true && (
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wide',
                        selected ? 'text-white/80' : 'text-emerald-500',
                      )}
                    >
                      ready
                    </span>
                  )}
                  {installed === false && (
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wide',
                        selected ? 'text-white/60' : 'text-muted-foreground',
                      )}
                    >
                      missing
                    </span>
                  )}
                  {selected && <PulseBeam color="green" size="sm" />}
                </button>
              );
            })}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
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
                    <div
                      data-testid="sessions-skeleton"
                      className="space-y-2 px-1 group-data-[collapsible=icon]:hidden"
                      aria-busy={true}
                      aria-label="Loading sessions"
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={`session-skel-${index}`}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        >
                          <SkeletonPulse width="20px" height="20px" rounded="md" />
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <SkeletonPulse
                              width={index % 2 === 0 ? '88%' : '72%'}
                              height="12px"
                              rounded="sm"
                            />
                            <SkeletonPulse width="36%" height="10px" rounded="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                if (sessions.length === 0) {
                  return (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                      No {activeAgent.name} sessions found
                    </p>
                  );
                }
                return sessions.slice(0, 12).map((s) => (
                  <SidebarMenuItem key={s.session_id}>
                    <SidebarMenuButton
                      tooltip={s.title}
                      data-testid={`session-item-${s.session_id}`}
                      onClick={() => loadSessionAsConversation(s.session_id, s.cwd || undefined)}
                      className="h-auto gap-3 py-2.5"
                    >
                      <AgentMark slug={activeAgentId} size={20} className="shrink-0" />
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                        <span className="line-clamp-1 w-full text-sm text-foreground">
                          {s.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(s.updated_at)}
                        </span>
                      </span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover={true}
                      onClick={(event) =>
                        handleResumeInTerminal(event, s.session_id, s.cwd || undefined)
                      }
                      aria-label="Resume in terminal"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ));
              })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Local chats
          </SidebarGroupLabel>
          <SidebarGroupAction onClick={createNew} aria-label="New conversation">
            <Plus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No conversations yet
                </p>
              ) : (
                conversations.map((c) => {
                  const chatAgentId: AgentId = isAgentId(c.agentId) ? c.agentId : activeAgentId;
                  return (
                    <SidebarMenuItem key={c.id}>
                      <SidebarMenuButton
                        isActive={c.id === activeId}
                        tooltip={c.title}
                        data-testid={`local-chat-${c.id}`}
                        onClick={() => onSelect(c.id)}
                        className="gap-3"
                      >
                        <AgentMark slug={chatAgentId} size={18} className="shrink-0" />
                        <span className="line-clamp-1">{c.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover={true}
                        onClick={() => deleteConversation(c.id)}
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-1 p-3">
        <SidebarMenuButton
          onClick={handleStartNewAgentSession}
          data-testid="new-agent-session"
          className="group-data-[collapsible=icon]:justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>New {activeAgent.name} session</span>
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={createNew}
          data-testid="new-local-chat"
          className="group-data-[collapsible=icon]:justify-center text-muted-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          <span>New local chat</span>
        </SidebarMenuButton>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
