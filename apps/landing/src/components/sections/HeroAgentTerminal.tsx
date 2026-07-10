'use client';

import { BuilderAssistantMark } from '@vybekiit-template-web/components/builder-assistant-mark';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MiniTerminalChrome } from '@/components/landing/kit/MiniTerminalChrome';
import { VibeCoderPromptDisplay } from '@/components/landing/kit/VibeCoderPromptDisplay';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import {
  HERO_AGENTS,
  HERO_VIBE_PROMPTS,
  type HeroAgent,
  type HeroAgentId,
  type HeroPromptEntry,
} from '@/data/heroAgentTerminal';
import type { VibeCoderPromptSegment } from '@/data/vibeCoderPrompts';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const PROMPT_HOLD_MS = 1600;
/** Slightly slower than a hard dump so left-aligned type feels human, not jittery. */
const PROMPT_TYPE_MS = 32;
const VISIBLE_AGENT_COUNT = 5;

/** Map hero segments to the shared prompt display type (no `cmd` chips in hero). */
const toDisplaySegments = (
  segments: HeroPromptEntry['segments'],
): readonly VibeCoderPromptSegment[] => segments;

interface ActiveHeroPromptProps {
  readonly entry: HeroPromptEntry;
  readonly agent: HeroAgent;
  readonly onFinished: () => void;
}

/**
 * Types one hero prompt, then advances the queue after a short hold.
 *
 * @param props - Active entry, agent meta, and finish callback.
 * @returns The rendered prompt line.
 */
const ActiveHeroPrompt = ({ entry, agent, onFinished }: ActiveHeroPromptProps) => {
  const reduced = useReducedMotion();
  const { displayText, isComplete } = useTypewriter(entry.typeable, {
    start: true,
    msPerChar: PROMPT_TYPE_MS,
    humanPace: true,
  });

  useEffect(() => {
    if (reduced || !isComplete) {
      return;
    }
    const timer = globalThis.setTimeout(onFinished, PROMPT_HOLD_MS);
    return () => globalThis.clearTimeout(timer);
  }, [isComplete, onFinished, reduced]);

  const typedChars = reduced ? entry.typeable.length : displayText.length;
  const segments = toDisplaySegments(entry.segments);

  return (
    <p className="ghostty-vibe-tui__prompt">
      {agent.builderMark ? (
        <BuilderAssistantMark
          active={true}
          assistant={agent.id as 'cursor' | 'claude' | 'codex'}
          className="ghostty-vibe-tui__prompt-mark"
          working={agent.id === 'claude' && !reduced && !isComplete}
        />
      ) : (
        <span className="ghostty-vibe-tui__prompt-mark hero-agent-logo-mark">
          <LogoMarkIcon className="size-full" slug={agent.slug} />
        </span>
      )}
      <VibeCoderPromptDisplay segments={segments} typedChars={typedChars} />
      <span className="sr-only">{entry.plain}</span>
      {reduced || isComplete ? null : (
        <span aria-hidden={true} className="ghostty-terminal__cursor" />
      )}
    </p>
  );
};

/**
 * Hero right-rail terminal: cycles AI agents and typewrites real vibe-coder productivity prompts.
 *
 * @returns The rendered hero agent terminal.
 * @example
 * <HeroAgentTerminal />
 */
export const HeroAgentTerminal = () => {
  const reduced = useReducedMotion();
  const [promptIndex, setPromptIndex] = useState(0);
  const agentsById = useMemo(() => {
    const map = new Map<HeroAgentId, HeroAgent>();
    for (const agent of HERO_AGENTS) {
      map.set(agent.id, agent);
    }
    return map;
  }, []);

  const firstPrompt = HERO_VIBE_PROMPTS[0];
  if (firstPrompt === undefined) {
    throw new Error('HERO_VIBE_PROMPTS must contain at least one prompt.');
  }

  const currentCandidate = HERO_VIBE_PROMPTS[promptIndex % HERO_VIBE_PROMPTS.length];
  const current = currentCandidate === undefined ? firstPrompt : currentCandidate;
  const currentAgent = agentsById.get(current.agentId) ?? HERO_AGENTS[0]!;

  const advancePrompt = useCallback(() => {
    setPromptIndex((index) => (index + 1) % HERO_VIBE_PROMPTS.length);
  }, []);

  useEffect(() => {
    if (!reduced) {
      return;
    }
    const timer = globalThis.setInterval(advancePrompt, PROMPT_HOLD_MS + 2800);
    return () => globalThis.clearInterval(timer);
  }, [advancePrompt, reduced]);

  // Show a sliding window of agents so the row stays compact but still cycles.
  const agentWindow = useMemo(() => {
    const start = promptIndex % HERO_AGENTS.length;
    const window: HeroAgent[] = [];
    for (let offset = 0; offset < VISIBLE_AGENT_COUNT; offset += 1) {
      const agent = HERO_AGENTS[(start + offset) % HERO_AGENTS.length];
      if (agent !== undefined) {
        window.push(agent);
      }
    }
    // Always pin the active agent first in the window for readability.
    const withoutActive = window.filter((agent) => agent.id !== currentAgent.id);
    return [currentAgent, ...withoutActive].slice(0, VISIBLE_AGENT_COUNT);
  }, [currentAgent, promptIndex]);

  return (
    <MiniTerminalChrome
      className="hero-agent-terminal w-full shadow-md"
      title={`${currentAgent.label} · zsh`}
      variant="macos"
    >
      <div
        aria-label="Vibe coders prompting AI coding agents"
        className="ghostty-vibe-tui"
        role="img"
      >
        <div className="ghostty-vibe-tui__marks">
          {agentWindow.map((agent) => {
            const active = agent.id === currentAgent.id;
            return (
              <div
                className={cn('ghostty-vibe-tui__mark', active && 'ghostty-vibe-tui__mark--active')}
                key={agent.id}
              >
                {agent.builderMark ? (
                  <BuilderAssistantMark
                    active={active}
                    assistant={agent.id as 'cursor' | 'claude' | 'codex'}
                    working={agent.id === 'claude' && active && !reduced}
                  />
                ) : (
                  <span className="hero-agent-logo-mark size-[18px]">
                    <LogoMarkIcon className="size-full" slug={agent.slug} />
                  </span>
                )}
                <span className="ghostty-vibe-tui__mark-label">{agent.label}</span>
              </div>
            );
          })}
        </div>

        <ActiveHeroPrompt
          agent={currentAgent}
          entry={current}
          key={promptIndex}
          onFinished={advancePrompt}
        />
      </div>
    </MiniTerminalChrome>
  );
};
