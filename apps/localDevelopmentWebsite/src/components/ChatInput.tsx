'use client';

import {
  AgentLogo,
  Button,
  PulseBeam,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@vybekiit/ui';
import { Image, Mic, Paperclip, Send, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { type AgentId, useAgentStore, useChatStore } from '@/stores';

type ChatInputProps = {
  conversationId: string | null;
  disabled?: boolean;
  onAgentSwitch?: () => void;
};

/** Voice waveform bars animation overlay */
const VoiceWaveform = ({ onStop }: { onStop: () => void }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border border-vybe-500/40 bg-zinc-950/95 backdrop-blur-sm">
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
    <p className="mt-3 text-xs text-zinc-400">Listening...</p>
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

/** Inline agent picker with hover-to-expand + 1s hold to switch */
const AgentPicker = ({ onSwitch }: { onSwitch: () => void }) => {
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const setActive = useAgentStore((s) => s.setActive);
  const agentsMap = useAgentStore((s) => s.agents);
  const activeAgent = agentsMap[activeAgentId];

  const [expanded, setExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState<AgentId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const agents = Object.values(agentsMap);

  const handleAgentHoverStart = (id: AgentId) => {
    setHoveredId(id);
    // After 1s of hovering, switch to that agent
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (id !== activeAgentId) {
        setActive(id);
        setToast(`✅ Switched to ${agentsMap[id].name}`);
        onSwitch();
        // Collapse after switch
        setTimeout(() => setExpanded(false), 600);
      }
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

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="relative" onMouseEnter={handleExpandEnter} onMouseLeave={handleExpandLeave}>
      {/* Active agent button (always visible) */}
      <button
        type="button"
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200',
          'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100',
          expanded && 'bg-zinc-800 text-zinc-100',
        )}
      >
        <AgentLogo slug={activeAgentId} size={16} />
        <span className="hidden sm:inline">{activeAgent.name.split(' ')[0]}</span>
        <PulseBeam color="green" size="sm" />
      </button>

      {/* Expanded picker */}
      {expanded && (
        <div className="absolute bottom-full left-0 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-md">
            <p className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
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
                    onMouseEnter={() => handleAgentHoverStart(agent.id)}
                    onMouseLeave={handleAgentHoverEnd}
                    onClick={() => {
                      if (agent.id !== activeAgentId) {
                        setActive(agent.id);
                        setToast(`✅ Switched to ${agent.name}`);
                        onSwitch();
                        setExpanded(false);
                      }
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all duration-300',
                      isActive && 'bg-vybe-500/10 text-zinc-100',
                      !isActive &&
                        isHovered &&
                        'bg-zinc-800 text-zinc-100 border border-white/60 scale-[1.02]',
                      !(isActive || isHovered) &&
                        'text-zinc-400 hover:text-zinc-200 border border-transparent',
                    )}
                  >
                    <AgentLogo slug={agent.id} size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{agent.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {agent.mcpSupported ? 'MCP ✓' : 'No MCP'}
                        {agent.id === activeAgentId && ' • active'}
                      </p>
                    </div>
                    {isActive && <PulseBeam color="green" size="sm" />}
                    {isHovered && !isActive && (
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />
                        <span className="text-[9px] text-zinc-500">hold...</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 border-t border-zinc-800 pt-1.5 px-2">
              <p className="text-[9px] text-zinc-600">Hover 1s to switch • Click for instant</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="absolute bottom-full left-0 mb-14 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 shadow-lg backdrop-blur-sm whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export const ChatInput = ({ conversationId, disabled = false, onAgentSwitch }: ChatInputProps) => {
  const [text, setText] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addMessage = useChatStore((s) => s.addMessage);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const agentsMap = useAgentStore((s) => s.agents);
  const activeAgent = agentsMap[activeAgentId];

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || !conversationId) return;

    setIsSending(true);
    addMessage(conversationId, { role: 'user', content: trimmed });
    setText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setTimeout(() => setIsSending(false), 300);
  }, [disabled, addMessage, conversationId, text]);

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
          'relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur transition',
          'focus-within:border-vybe-500/40 focus-within:ring-1 focus-within:ring-vybe-500/20',
        )}
      >
        {isVoiceActive && <VoiceWaveform onStop={() => setIsVoiceActive(false)} />}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={`Message ${activeAgent.name}...`}
          disabled={disabled || isVoiceActive}
          rows={1}
          className="min-h-[44px] max-h-[200px] w-full resize-none bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />

        <div className="flex items-center justify-between border-t border-zinc-800/50 px-2 py-2">
          <div className="flex items-center gap-1">
            {/* Agent Picker — LEFT of input actions */}
            <AgentPicker onSwitch={() => onAgentSwitch?.()} />

            <div className="mx-1 h-4 w-px bg-zinc-800" />

            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Attach file"
                  className="text-zinc-400 hover:text-zinc-200"
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
                  className="text-zinc-400 hover:text-zinc-200"
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
                    isVoiceActive ? 'text-vybe-400' : 'text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input</TooltipContent>
            </Tooltip>
          </div>

          <Button
            onClick={submit}
            disabled={disabled || !hasContent}
            size="icon-sm"
            className={cn(
              'rounded-xl transition-all duration-200',
              hasContent
                ? 'scale-100 bg-vybe-600 text-white shadow-lg shadow-vybe-600/25 hover:bg-vybe-500 hover:shadow-vybe-500/30 hover:scale-105 active:scale-95'
                : 'scale-90 bg-zinc-800 text-zinc-500',
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
