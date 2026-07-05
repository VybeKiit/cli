'use client';

import {
  AgentAvatar,
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
} from '@vybekiit/ui';
import { Clock, MessageSquare, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useAgentSessions } from '@/hooks';
import { cn } from '@/lib/utils';
import { type AgentId, useAgentStore, useChatStore } from '@/stores';

interface ChatSidebarProps {
  activeId: string | null;
  onSelect: (id: string) => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

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

  // Reload sessions when agent changes
  useEffect(() => {
    refresh();
  }, [activeAgentId, refresh]);

  const createNew = useCallback(() => {
    const c = createConversation(`New chat \u2022 ${activeAgent.name}`, activeAgent.id);
    onSelect(c.id);
  }, [activeAgent, createConversation, onSelect]);

  const loadSessionAsConversation = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) return;

        const data = (await res.json()) as {
          session_id: string;
          title: string;
          messages: Array<{ role: string; content: string }>;
        };

        // Create a local conversation with loaded messages
        const c = createConversation(data.title || `Session ${sessionId}`, activeAgent.id);
        for (const msg of data.messages) {
          addMessage(c.id, {
            role: msg.role === 'user' ? 'user' : 'agent',
            content: msg.content,
          });
        }
        onSelect(c.id);
      } catch (_err) {
        // Silently fail — session load is best-effort
      }
    },
    [activeAgent, createConversation, addMessage, onSelect],
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-800 bg-zinc-950/50">
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <span className="font-semibold text-sm text-zinc-100 group-data-[collapsible=icon]:hidden">
            VybeKiit
          </span>
          <PulseBeam color="green" size="sm" />
        </div>

        {/* Agent Picker */}
        <div className="mt-3 flex flex-wrap gap-1.5 group-data-[collapsible=icon]:hidden">
          {(Object.keys(agentsMap) as AgentId[]).map((id) => {
            const agent = agentsMap[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all',
                  id === activeAgentId
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300',
                )}
              >
                <AgentLogo slug={id} size={14} />
                <span>{agent.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Real Agent Sessions (from filesystem) */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {activeAgent.name} Sessions
          </SidebarGroupLabel>
          <SidebarGroupAction onClick={refresh} aria-label="Refresh sessions">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && sessions.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-zinc-600 group-data-[collapsible=icon]:hidden">
                  Loading sessions&hellip;
                </p>
              ) : sessions.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-zinc-600 group-data-[collapsible=icon]:hidden">
                  No {activeAgent.name} sessions found
                </p>
              ) : (
                sessions.slice(0, 15).map((s) => (
                  <SidebarMenuItem key={s.session_id}>
                    <SidebarMenuButton
                      tooltip={s.title}
                      onClick={() => loadSessionAsConversation(s.session_id)}
                      className="h-auto flex-col items-start gap-0 py-2"
                    >
                      <span className="line-clamp-1 w-full text-xs text-zinc-300">{s.title}</span>
                      <span className="text-[10px] text-zinc-600">{formatTime(s.updated_at)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Local Conversations */}
        <SidebarGroup>
          <SidebarGroupLabel>Local Chats</SidebarGroupLabel>
          <SidebarGroupAction onClick={createNew} aria-label="New conversation">
            <Plus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-zinc-500 group-data-[collapsible=icon]:hidden">
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

      <SidebarFooter className="space-y-1 p-2">
        <SidebarMenuButton
          onClick={() => createSession(`New project \u2022 ${new Date().toLocaleDateString()}`)}
          className="group-data-[collapsible=icon]:justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>New {activeAgent.name} session</span>
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={createNew}
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

export const ChatSidebarTrigger = SidebarTrigger;
export { SidebarProvider };
