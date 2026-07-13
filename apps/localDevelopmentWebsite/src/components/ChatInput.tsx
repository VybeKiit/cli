'use client';

import {
  Button,
  PulseBeam,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@vybekiit/ui';
import { Image, Mic, Paperclip, Send, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AgentMark } from '@/components/AgentMark';
import type { AgentId } from '@/lib/agents/registry';
import { getOpenableScenario, scenarioIdFromSearch } from '@/lib/openableScenarios';
import { runJourneyFixtures, shouldUseJourneyFixtures } from '@/lib/runJourneyFixtures';
import { cn } from '@/lib/utils';
import { useAgentStore, useChatStore, useJourneyStore } from '@/stores';

type ChatInputProps = {
  conversationId: string | null;
  disabled?: boolean;
  onAgentSwitch?: () => void;
};

/**
 * Status chip under an agent name in the picker (install probe + mode hint).
 *
 * @param agent - Agent row from the store (may still be probing install state).
 * @returns Short status label for the picker.
 * @example
 * agentInstallStatusLabel({ installed: true, mcpSupported: false }) // → 'Installed'
 */
const agentInstallStatusLabel = (agent: {
  readonly installed?: boolean;
  readonly mcpSupported: boolean;
}): string => {
  if (agent.installed === true) {
    return 'Installed';
  }
  if (agent.installed === false) {
    return 'Not installed';
  }
  if (agent.mcpSupported) {
    return 'MCP';
  }
  return 'CLI';
};

/** Voice waveform bars animation overlay */
const VoiceWaveform = ({ onStop }: { onStop: () => void }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border border-vybe-500/40 bg-background/95 backdrop-blur-sm">
    <div className="flex h-12 items-end gap-[3px]">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className="voice-bar w-[3px] rounded-full bg-vybe-400"
          style={
            {
              '--bar-height': `${30 + Math.random() * 70}%`,
              '--bar-duration': `${0.4 + Math.random() * 0.6}s`,
              '--bar-delay': `${i * 0.04}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
    <p className="mt-3 text-xs text-muted-foreground">Listening...</p>
    <Button
      variant="ghost"
      size="sm"
      onClick={onStop}
      className="mt-2 text-red-400 hover:text-red-300"
    >
      <Square className="mr-1.5 h-3 w-3" />
      Stop
    </Button>
  </div>
);

/** Inline agent picker with click-to-switch (and optional hover-hold). */
const AgentPicker = ({ onSwitch }: { onSwitch: () => void }) => {
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const setActive = useAgentStore((s) => s.setActive);
  const agentsMap = useAgentStore((s) => s.agents);
  const activeAgent = agentsMap[activeAgentId];

  const [expanded, setExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState<AgentId | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const agents = Object.values(agentsMap);

  const switchTo = (id: AgentId) => {
    if (id === activeAgentId) {
      return;
    }
    setActive(id);
    setToastMsg(`Switched to ${agentsMap[id].name}`);
    onSwitch();
    setTimeout(() => setExpanded(false), 400);
  };

  const handleAgentHoverStart = (id: AgentId) => {
    setHoveredId(id);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      switchTo(id);
    }, 1000);
  };

  const handleAgentHoverEnd = () => {
    setHoveredId(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleExpandEnter = () => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    setExpanded(true);
  };

  const handleExpandLeave = () => {
    collapseTimerRef.current = setTimeout(() => {
      setExpanded(false);
      setHoveredId(null);
    }, 400);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  return (
    <div className="relative" onMouseEnter={handleExpandEnter} onMouseLeave={handleExpandLeave}>
      <button
        type="button"
        data-testid="agent-picker-trigger"
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200',
          'hover:bg-muted text-muted-foreground hover:text-foreground',
          expanded && 'bg-muted text-foreground',
        )}
      >
        <AgentMark slug={activeAgentId} size={16} />
        <span className="hidden sm:inline">{activeAgent.name.split(' ')[0]}</span>
        <PulseBeam color="green" size="sm" />
      </button>

      {expanded && (
        <div className="absolute bottom-full left-0 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="max-h-80 overflow-y-auto rounded-xl border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur-md">
            <p className="px-2 pb-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              Choose agent
            </p>
            <div className="space-y-0.5">
              {agents.map((agent) => {
                const isActive = agent.id === activeAgentId;
                const isHovered = hoveredId === agent.id;

                return (
                  <button
                    key={agent.id}
                    type="button"
                    data-testid={`agent-picker-${agent.id}`}
                    onMouseEnter={() => handleAgentHoverStart(agent.id)}
                    onMouseLeave={handleAgentHoverEnd}
                    onClick={() => switchTo(agent.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all duration-300',
                      isActive && 'bg-vybe-500/10 text-foreground',
                      !isActive &&
                        isHovered &&
                        'bg-muted text-foreground border border-border scale-[1.02]',
                      !(isActive || isHovered) &&
                        'text-muted-foreground hover:text-foreground border border-transparent',
                    )}
                  >
                    <AgentMark slug={agent.id} size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agentInstallStatusLabel(agent)}
                        {isActive && ' · active'}
                      </p>
                    </div>
                    {isActive && <PulseBeam color="green" size="sm" />}
                    {isHovered && !isActive && (
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-pulse" />
                        <span className="text-xs text-muted-foreground">hold…</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 border-t border-border pt-1.5 px-2">
              <p className="text-xs text-muted-foreground">Click to switch · hover 1s also works</p>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="absolute bottom-full left-0 mb-14 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-300 shadow-lg backdrop-blur-sm whitespace-nowrap">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Render the chat input component.
 *
 * @param conversationId - Active conversation receiving the outgoing message.
 * @param disabled - Whether the input is locked.
 * @param onAgentSwitch - Callback fired after the active agent changes.
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <ChatInput conversationId="local-1" onAgentSwitch={refreshSessions} />;
 */
export const ChatInput = ({ conversationId, disabled = false, onAgentSwitch }: ChatInputProps) => {
  const [text, setText] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoScenarioRan = useRef(false);
  const addMessage = useChatStore((s) => s.addMessage);
  const seedFromMessage = useJourneyStore((s) => s.seedFromMessage);
  const applyTool = useJourneyStore((s) => s.applyTool);
  const setSimulating = useJourneyStore((s) => s.setSimulating);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const agentsMap = useAgentStore((s) => s.agents);
  const activeAgent = agentsMap[activeAgentId];

  const submitPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || disabled || !conversationId) return;

      setIsSending(true);
      addMessage(conversationId, { role: 'user', content: trimmed });
      setText('');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Domain journeys (auth / db / payments / deploy) — seed rail from plain words.
      const seeded = seedFromMessage(trimmed);
      const useFixtures =
        typeof window !== 'undefined' &&
        shouldUseJourneyFixtures(window.location.search, {
          NEXT_PUBLIC_ASSISTANT_FIXTURE: process.env.NEXT_PUBLIC_ASSISTANT_FIXTURE,
          PLAYWRIGHT: process.env.PLAYWRIGHT,
          CI: process.env.CI,
        });

      if (seeded.length > 0 && useFixtures) {
        runJourneyFixtures(
          seeded,
          applyTool,
          () => setSimulating(true),
          () => setSimulating(false),
        );
        addMessage(conversationId, {
          role: 'agent',
          content: `Working on: ${seeded.map((j) => j.title).join(', ')}. Watch the Live work cards update as tools run.`,
        });
        setIsSending(false);
        return;
      }

      if (seeded.length > 0) {
        addMessage(conversationId, {
          role: 'agent',
          content: `Got it — ${seeded.map((j) => j.title).join(', ')}. Opening ${activeAgent.name} so it can run the real tools.`,
        });
      }

      // Open the real agent CLI with this prompt so the message actually reaches the agent.
      try {
        const res = await fetch('/api/agents/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: activeAgentId,
            mode: 'new',
            prompt: trimmed,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          launched?: boolean;
          command?: string;
          message?: string;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? 'Launch failed');
        }
        addMessage(conversationId, {
          role: 'agent',
          content: data.launched
            ? `Opened ${activeAgent.name} in your terminal with that message.\n\`${data.command}\``
            : `${data.message ?? 'Could not open Terminal automatically.'}\n\nRun:\n\`${data.command}\``,
        });
        if (data.command) {
          try {
            await navigator.clipboard.writeText(data.command);
          } catch {
            // optional
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not reach agent';
        addMessage(conversationId, {
          role: 'agent',
          content: `Could not launch ${activeAgent.name}: ${message}`,
        });
        toast.error(message);
      } finally {
        setIsSending(false);
      }
    },
    [
      disabled,
      addMessage,
      conversationId,
      activeAgentId,
      activeAgent.name,
      seedFromMessage,
      applyTool,
      setSimulating,
    ],
  );

  const submit = useCallback(async () => {
    await submitPrompt(text);
  }, [submitPrompt, text]);

  // Auto-run openable scenario from ?fixture=1&scenario=<id> so maintainers can open each URL.
  // Prefer /scenarios for click demos; this path is for deep-links into chat.
  useEffect(() => {
    if (autoScenarioRan.current || disabled || !conversationId) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const scenarioId = scenarioIdFromSearch(window.location.search);
    if (scenarioId === null) {
      return;
    }
    const scenario = getOpenableScenario(scenarioId);
    if (scenario === undefined) {
      toast.error(`Unknown scenario: ${scenarioId}`);
      return;
    }
    autoScenarioRan.current = true;
    // Next tick: chat store may still be creating the first conversation on the same frame.
    const timer = window.setTimeout(() => {
      void submitPrompt(scenario.prompt);
      toast.message(`Running scenario: ${scenario.label}`);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [conversationId, disabled, submitPrompt]);

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const hasContent = text.trim().length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'relative flex flex-col rounded-2xl border border-border bg-card/80 backdrop-blur transition',
          'focus-within:border-vybe-500/40 focus-within:ring-1 focus-within:ring-vybe-500/20',
        )}
      >
        {isVoiceActive && <VoiceWaveform onStop={() => setIsVoiceActive(false)} />}

        <textarea
          ref={textareaRef}
          data-testid="chat-input"
          value={text}
          onChange={autoResize}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={`Message ${activeAgent.name}...`}
          disabled={disabled || isVoiceActive}
          rows={1}
          className="min-h-[44px] max-h-[200px] w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <div className="flex items-center justify-between border-t border-border/50 px-2 py-2">
          <div className="flex items-center gap-1">
            <AgentPicker onSwitch={() => onAgentSwitch?.()} />

            <div className="mx-1 h-4 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Attach file"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Paste image"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Paste image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Voice input"
                  onClick={() => setIsVoiceActive(true)}
                  className={cn(
                    'transition-colors',
                    isVoiceActive ? 'text-vybe-400' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input</TooltipContent>
            </Tooltip>
          </div>

          <Button
            onClick={() => void submit()}
            disabled={disabled || !hasContent || isSending}
            size="icon-sm"
            className={cn(
              'rounded-xl transition-all duration-200',
              hasContent
                ? 'scale-100 bg-vybe-600 text-white shadow-lg shadow-vybe-600/25 hover:bg-vybe-500 hover:shadow-vybe-500/30 hover:scale-105 active:scale-95'
                : 'scale-90 bg-muted text-muted-foreground',
              isSending && 'animate-ping-once scale-95',
            )}
          >
            <Send className={cn('h-4 w-4 transition-transform', hasContent && '-rotate-12')} />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
