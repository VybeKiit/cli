'use client';

import { BuilderAssistantMark } from '@vybekiit-template-web/components/builder-assistant-mark';
import { useCallback, useEffect, useState } from 'react';
import { VibeCoderPromptDisplay } from '@/components/landing/kit/VibeCoderPromptDisplay';
import {
  VIBE_CODER_ASSISTANT_LABELS,
  VIBE_CODER_PROMPTS,
  type VibeCoderAssistant,
  type VibeCoderPromptEntry,
} from '@/data/vibeCoderPrompts';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const ASSISTANTS: readonly VibeCoderAssistant[] = ['cursor', 'claude', 'codex'];
const PROMPT_HOLD_MS = 1200;
const PROMPT_TYPE_MS = 34;

interface ActivePromptLineProps {
  readonly entry: VibeCoderPromptEntry;
  readonly onFinished: () => void;
  readonly onTypingChange?: ((typing: boolean) => void) | undefined;
}

/** Types one prompt, then signals the parent to advance the queue. */
const ActivePromptLine = ({ entry, onFinished, onTypingChange }: ActivePromptLineProps) => {
  const reduced = useReducedMotion();
  const { displayText, isComplete } = useTypewriter(entry.typeable, {
    start: true,
    msPerChar: PROMPT_TYPE_MS,
    humanPace: true,
  });

  useEffect(() => {
    onTypingChange?.(!(reduced || isComplete));
    return () => onTypingChange?.(false);
  }, [isComplete, onTypingChange, reduced]);

  useEffect(() => {
    if (reduced) {
      return;
    }
    if (!isComplete) {
      return;
    }
    const timer = globalThis.setTimeout(onFinished, PROMPT_HOLD_MS);
    return () => globalThis.clearTimeout(timer);
  }, [isComplete, onFinished, reduced]);

  const typedChars = reduced ? entry.typeable.length : displayText.length;

  return (
    <p className="ghostty-vibe-tui__prompt">
      <BuilderAssistantMark
        active={true}
        assistant={entry.assistant}
        className="ghostty-vibe-tui__prompt-mark"
        working={entry.assistant === 'claude' && !reduced && !isComplete}
      />
      <VibeCoderPromptDisplay segments={entry.segments} typedChars={typedChars} />
      <span className="sr-only">{entry.plain}</span>
      {reduced || isComplete ? null : (
        <span aria-hidden={true} className="ghostty-terminal__cursor" />
      )}
    </p>
  );
};

/**
 * Cycles vibe-coder prompts across Cursor, Claude Code, and Codex inside the checkout terminal.
 *
 * @returns The rendered PricingVibeCoderTui element.
 * @example
 * ```tsx
 * <PricingVibeCoderTui />
 * ```
 */

export const PricingVibeCoderTui = () => {
  const reduced = useReducedMotion();
  const [promptIndex, setPromptIndex] = useState(0);
  const [claudeWorking, setClaudeWorking] = useState(false);
  const firstPrompt = VIBE_CODER_PROMPTS[0];
  if (firstPrompt === undefined) {
    throw new Error('VIBE_CODER_PROMPTS must contain at least one prompt.');
  }
  const currentCandidate = VIBE_CODER_PROMPTS[promptIndex % VIBE_CODER_PROMPTS.length];
  const current = currentCandidate === undefined ? firstPrompt : currentCandidate;
  const claudeIsActive = current.assistant === 'claude';

  const advancePrompt = useCallback(() => {
    setPromptIndex((index) => (index + 1) % VIBE_CODER_PROMPTS.length);
  }, []);

  const handleClaudeTypingChange = useCallback((typing: boolean) => {
    setClaudeWorking(typing);
  }, []);

  useEffect(() => {
    if (!claudeIsActive) {
      setClaudeWorking(false);
    }
  }, [claudeIsActive]);

  useEffect(() => {
    if (!reduced) {
      return;
    }
    const timer = globalThis.setInterval(advancePrompt, PROMPT_HOLD_MS + 2400);
    return () => globalThis.clearInterval(timer);
  }, [advancePrompt, reduced]);

  return (
    <div
      aria-label="Vibe coders prompting Cursor, Claude Code, and Codex"
      className="ghostty-vibe-tui"
      role="img"
    >
      <div className="ghostty-vibe-tui__marks">
        {ASSISTANTS.map((assistant) => (
          <div
            className={cn(
              'ghostty-vibe-tui__mark',
              current.assistant === assistant && 'ghostty-vibe-tui__mark--active',
            )}
            key={assistant}
          >
            <BuilderAssistantMark
              active={current.assistant === assistant}
              assistant={assistant}
              working={assistant === 'claude' && claudeIsActive && claudeWorking}
            />
            <span className="ghostty-vibe-tui__mark-label">
              {VIBE_CODER_ASSISTANT_LABELS[assistant]}
            </span>
          </div>
        ))}
      </div>

      <ActivePromptLine
        entry={current}
        key={promptIndex}
        onFinished={advancePrompt}
        {...(claudeIsActive ? { onTypingChange: handleClaudeTypingChange } : {})}
      />
    </div>
  );
};
